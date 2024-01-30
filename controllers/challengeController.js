const Challenge = require('./../models/challenge');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');

exports.setChallengeUserIds = (req, res, next) => {
  if (!req.body.challenge) req.body.challenge = req.params.challengeId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllChallenges = factory.getAll(Challenge);
exports.getChallenge = factory.getOne(Challenge, {
  path: 'playerChallengers',
});
exports.updateChallenge = factory.updateOne(Challenge);
exports.deleteChallenge = factory.deleteOne(Challenge);

exports.createChallenge = catchAsync(async (req, res, next) => {
  await Challenge.create({
    playerChallengers: [req.body.playerOne, req.body.playerTwo],
  });
  res.status(200).json({
    status: 'success',
    message: 'Challenge creata',
  });
});

exports.createOnePlayerChallenge = catchAsync(async (req, res, next) => {
  await Challenge.create({
    playerChallengers: [req.body.playerOne, req.body.playerTwo],
  });
  res.status(200).json({
    status: 'success',
    message: 'Challenge creata',
  });
});
