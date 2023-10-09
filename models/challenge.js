const mongoose = require('mongoose');

const challengesSchema = new mongoose.Schema({
  playerChallengers: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Challenge must required a player challenger'],
    },
  ],
  challengerDecks: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Deck',
      required: [true, 'Challenge must required a deck challenger'],
    },
  ],
  status: {
    type: String,
    enum: ['on_hold', 'in_progress', 'completed'],
    default: 'on_hold',
  },
  winner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  startTime: {
    type: Date,
    default: Date.now(),
  },
  endTime: {
    type: Date,
  },
});

challengesSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'playerChallengers',
    select: 'name',
  });
  next();
});

challengesSchema.set('toJSON', { virtuals: true });
challengesSchema.set('toObject', { getters: true });

const Challenge = mongoose.model('Challenge', challengesSchema, 'challenges');

module.exports = Challenge;
