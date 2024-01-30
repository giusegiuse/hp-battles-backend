const mongoose = require('mongoose');
const User = require('./user');

const challengesSchema = new mongoose.Schema({
  playerChallengers: {
    type: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Challenge must required a player challenger'],
      },
    ],
    validate: {
      validator: function (value) {
        return value.length <= 2;
      },
      message: 'Player challengers must be at most 2.',
    },
  },
  challengerDecks: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Deck',
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

challengesSchema.statics.calculateWinPercentage = async function (userIds) {
  for (const userId of userIds) {
    const stats = await this.aggregate([
      {
        $match: { playerChallengers: { $in: [userId] } },
      },
      {
        $group: {
          _id: '$playerChallengers',
          nChallenges: { $sum: 1 },
          nVictories: { $sum: { $cond: [{ $eq: ['$winner', userId] }, 1, 0] } },
        },
      },
    ]);

    const userStats = stats[0];
    const nChallenges = userStats.nChallenges;
    const nVictories = userStats.nVictories;
    const winPercentage = (nVictories / nChallenges) * 100;
    if (stats.length > 0) {
      await User.findByIdAndUpdate(userId, {
        challengesQuantity: nChallenges,
        victories: nVictories,
        avgVictories: winPercentage,
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        challengesQuantity: 0,
        victories: 0,
        avgVictories: 0,
      });
    }
  }
};

challengesSchema.pre('save', function (next) {
  //this points to current challenge
  this.constructor.calculateWinPercentage(this.playerChallengers);
  next();
});

challengesSchema.pre(/^findOneAnd/, async function (next) {
  this.c = await this.clone().findOne();
  next();
});

challengesSchema.post(/^findOneAnd/, async function (next) {
  //await this.findOne(); does NOT work here, query has already executed
  const userIds = this.c.playerChallengers.map((user) => user._id);
  await this.c.constructor.calculateWinPercentage(userIds);
});

const Challenge = mongoose.model('Challenge', challengesSchema, 'challenges');

module.exports = Challenge;
