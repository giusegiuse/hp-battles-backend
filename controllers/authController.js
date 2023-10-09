const { promisify } = require('util');
const User = require('./../models/user');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/emailSender');
const crypto = require('crypto');
const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  ),
  //specificando httponly a true il browser non potrà modificare in alcun modo il cookie.
  httpOnly: true,
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  //Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    decks: req.body.decks,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Inserisci una email e una password ', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email: email }).select('+password');

  //se l'utente non esiste o la password inserita dall'utente non è la password salvata su db
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Email o password non corrette', 401));
  }

  //3) se tutto è ok inviamo il token al client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token anc check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookie.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'Non sei loggato. Per favore effettua il login per accedere.',
        401,
      ),
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('Il token di questo utente non esiste più', 401));
  }
  // 4) Check if user changed password after the token was issued
  if (await currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "L'utente ha modificato recententemente la password. Per favore effettua il login nuovamente",
        401,
      ),
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'Non hai il permesso di effettuare questa operazione',
          403,
        ),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based in POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError('Non ci sono utenti con questo indirizzo email', 404),
    );
  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  //validateBeforeSave => disattiverà tutti i validatori dello schema
  await user.save({ validateBeforeSave: false });

  //3 Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/users/resetPassword/${resetToken}`;

  const message = `Password dimenticata? Richiedina una nuova a: ${resetURL}.\n  se non hai dimenticato la password, 
  ignora la richiesta`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset password',
      message: message,
    });

    createSendToken(user, 200, res);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        `Si è verificato un errore durante l'invio della mail. Prova più tardi!`,
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) if token has noy expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Il token non è valido o è scaduto', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update the change password for the user
  createSendToken(user, 200, res);

  //4) Log the user in, send JWT
});

exports.updatePassword = async (req, res, next) => {
  const { password, passwordConfirm, passwordCurrent } = req.body;
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(
      new AppError('Non ci sono utenti con questo indirizzo email', 404),
    );
  }
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('La tua password attuale è errata', 401));
  }
  // 3) If so, update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  // Non possiamo usare findByIdAndUpdate perchè non funzionarebbeo i validatori definiti nel modello User

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
};
