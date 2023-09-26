const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const usersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome obbligatorio'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email obbligatoria'],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Inserisci una email valida'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Password obbligatoria'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Conferma la tua password'],
    validate: {
      //This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Le Password non sono le stesse',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  photo: String,
});

usersSchema.pre('save', async function (next) {
  //Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  //il 12 indica il costo dell'operazione, quanto intensamente lavorerà la cpu per l'operazione di hash della pwd (default 10) è maglio però utilizzare 12 per una maggiore sicurezza

  //delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

usersSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  //grazie al -1000 il token risulterà creato dopo che la password è stata cambiata
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

usersSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

usersSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp =
      parseInt(this.passwordChangedAt.getTime(), 10) / 1000;
    return JWTTimestamp < changedTimestamp;
  }

  //false means not changed
  return false;
};

usersSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', usersSchema, 'users');

module.exports = User;
