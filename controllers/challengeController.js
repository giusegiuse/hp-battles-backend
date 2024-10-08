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
        challengeId: req.body.challenge.challengeId,
    });
});

exports.checkInProgressChallenge = catchAsync(async (req, res, next) => {
    const isChallengeInProgress = await checkInProgressChallenge(req.params.id);
    if (isChallengeInProgress) {
        return sendChallengeInProgressError(res);
    }
    res.status(200).json({
        status: 'success',
        message: 'No challenge in progress',
    });
});

exports.createOnePlayerChallenge = catchAsync(async (req, res, next) => {
    const isChallengeInProgress = await checkInProgressChallenge(
        req.body.playerOne,
    );
    if (isChallengeInProgress) {
        return sendChallengeInProgressError(res);
    }

    const newChallenge = await Challenge.create({
        playerChallengers: [req.body.playerOne, req.body.playerTwo],
    });
    res.status(200).json({
        status: 'success',
        message: 'Challenge creata',
        challengeId: newChallenge._id,
    });
});

exports.getOpponentUserId = catchAsync(async (req, res, next) => {
    const userId = req.params.id;
    const challenges = await Challenge.find({
        playerChallengers: userId,
        status: 'in_progress',
    });
    return challenges.flatMap((challenge) => {
        return challenge.playerChallengers
            .filter((challenger) => {
                return String(challenger._id) !== String(userId);
            })
            .map((challenger) => {
                res.status(200);
                res.send(challenger._id);
            });
    });
});

exports.deleteAllInProgressChallenges = catchAsync(async (req, res, next) => {
    const userId = req.params.id;
    await Challenge.deleteMany({
        status: 'in_progress',
        playerChallengers: {$elemMatch: {$eq: userId}},
    });
    res.status(200).json({
        status: 'success',
        message: 'All in progress challenges deleted',
    });
});

exports.setChallengeWinner = catchAsync(async (req, res, next) => {
    const userId = req.params.id;
    const challenge = await Challenge.findOne({
        playerChallengers: userId,
        status: 'in_progress',
    });
    if (!challenge) {
        return res.status(404).json({
            status: 'fail',
            message: 'Challenge not found',
        });
    }
    challenge.winner = userId;
    challenge.status = 'completed';
    await challenge.save();
    res.status(200).json({
        status: 'success',
        message: 'Challenge completed',
    });
});

const checkInProgressChallenge = async (playerId) => {
    const existingChallenges = await Challenge.findOne({
        playerChallengers: playerId,
        status: 'in_progress',
    });
    return !!existingChallenges;
};

const sendChallengeInProgressError = (res) => {
    return res.status(400).json({
        status: 'fail',
        message: 'There is already a challenge in progress for this player.',
    });
};
