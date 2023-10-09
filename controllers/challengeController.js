const Challenge = require('./../models/challenge');
const factory = require('./handlerFactory');

exports.setChallengeUserIds = (req, res, next) => {
  if (!req.body.challenge) req.body.challenge = req.params.challengeId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllChallenges = factory.getAll(Challenge);
exports.getChallenge = factory.getOne(Challenge, {
  path: 'playerChallengers',
});
exports.createChallenge = factory.createOne(Challenge);
exports.updateChallenge = factory.updateOne(Challenge);
exports.deleteChallenge = factory.deleteOne(Challenge);
