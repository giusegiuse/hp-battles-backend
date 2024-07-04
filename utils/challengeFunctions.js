const Challenge = require('./../models/challenge');

const getOpponentUserID = async (userId) => {
  const challenges = await Challenge.find({
    playerChallengers: userId,
    status: 'in_progress',
  });

  return challenges.flatMap((challenge) => {
    return challenge.playerChallengers
      .filter((challenger) => String(challenger._id) !== String(userId))
      .map((challenger) => challenger._id);
  });
};

module.exports = {
  getOpponentUserID,
};
