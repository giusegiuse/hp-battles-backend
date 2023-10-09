const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

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
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  photo: String,
  decks: [
    {
      name: String,
      cards: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'Character',
          quantity: Number,
        },
      ],
    },
  ],
  //Virtual Populate => non voglio memorizzare tutte le sfide di un utente sulla collezione User, per ottenere però
  // tutte le sfide di un utente senza memorizzare nulla sul db posso utilizzare la virtual populate
});

usersSchema.virtual('challenges_details', {
  ref: 'Challenge',
  foreignField: 'playerChallengers',
  localField: '_id',
});
//fine virtual populate il passaggio finale è di inserire populate nella rotta getUser

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

//Non serve perchè quando un utente si registra non ha ancora deck
// usersSchema.pre('save', async function (next) {
//   const decksPromises = this.decks.map(async (id) => await User.findById(id));
//   this.decks = await Promise.all(decksPromises);
//   next();
// });

// /^find/ => regular expression per attivarlo su tutte le query che iniziano con find
usersSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

usersSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'decks',
    select: '-_id',
    populate: {
      path: 'cards',
      select: 'name',
    },
  });
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

usersSchema.plugin(mongooseLeanVirtuals);
usersSchema.set('toObject', { getters: true, virtuals: true });
usersSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: function (doc, ret) {
    if (ret.challenges_details) {
      ret.challenges_details = ret.challenges_details.map((challenge) => ({
        playerChallengers: challenge.playerChallengers,
        status: challenge.status,
        winner: challenge.winner,
        startTime: challenge.startTime,
        endTime: challenge.endTime,
      }));
    }
    delete ret.id;
    delete ret.decks;

    return ret;
  },
});

const User = mongoose.model('User', usersSchema, 'users');

module.exports = User;
