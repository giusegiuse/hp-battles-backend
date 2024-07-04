const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const Deck = require('./../models/deck');
const Character = require('../models/character');
const Challenge = require('../models/challenge');
const { getOpponentUserID } = require('./../utils/challengeFunctions');

exports.getDeckCharacters = catchAsync(async (req, res, next) => {
  const deck = await Deck.findOne({
    playerChallenger: req.params.userId,
  }).sort({
    creationDate: -1,
  });

  if (!deck) {
    return res.status(404).json({
      status: 'fail',
      message: 'Deck not found for this user',
    });
  }
  const characters = await Character.find({
    _id: { $in: deck.characters.map((char) => char.character) },
  });
  if (characters.length === 0) {
    return res.status(404).json({
      status: 'fail',
      message: 'No characters found for this deck',
    });
  }

  res.status(200).json({
    status: 'success',
    data: characters,
  });
});

exports.getOppenentDeckCharacters = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const challenges = await Challenge.find({
    playerChallengers: userId,
    status: 'in_progress',
  })
    .sort({
      creationDate: -1,
    })
    .select('playerChallengers');

  //TODO delete this because i have created getOpponentUserId in challengecontroller
  const opponentUserIds = challenges.flatMap((challenge) => {
    return challenge.playerChallengers
      .filter((challenger) => {
        return String(challenger._id) !== String(userId);
      })
      .map((challenger) => {
        return challenger._id;
      });
  });
  const deck = await Deck.findOne({
    playerChallenger: opponentUserIds[0],
  }).sort({
    creationDate: -1,
  });

  if (!deck) {
    return res.status(404).json({
      status: 'fail',
      message: 'Deck not found for this user',
    });
  }
  const characters = await Character.find({
    _id: { $in: deck.characters.map((char) => char.character) },
  });
  if (characters.length === 0) {
    return res.status(404).json({
      status: 'fail',
      message: 'No characters found for this deck',
    });
  }

  res.status(200).json({
    status: 'success',
    data: characters,
  });
});

exports.create = catchAsync(async (req, res, next) => {
  if (!req.body) {
    //todo ERRORE
  }
  await Deck.create({
    playerChallenger: req.body.userId,
    challenge: req.body.challengeId,
  });
});

exports.addCharacter = catchAsync(async (req, res, next) => {
  const { userId, characterId } = req.body;
  const deck = await Deck.findOne({ playerChallenger: userId }).sort({
    creationDate: -1,
  });
  const character = await Character.findById(characterId);
  if (!character) {
    return next(new AppError('No character found with that ID', 404));
  }
  if (deck.money < character.cost) {
    return next(new AppError('Not enough money in the deck', 400));
  }
  const newCharacter = {
    character: character._id,
    current_health: character.life,
    turns_blocked: 0,
  };
  deck.characters.push(newCharacter);
  deck.money = deck.money - character.cost;

  await deck.save();

  res.status(200).json({
    status: 'success',
    data: deck,
  });
});

exports.removeCharacter = catchAsync(async (req, res, next) => {
  const deck = await Deck.findOne().sort({ creationDate: -1 });
  const character = await Character.findOne({ _id: req.params.characterId });
  if (!character) {
    return next(new AppError('No character found with that ID', 404));
  }
  deck.money = deck.money + character.cost;
  deck.characters.pull(req.params.characterId);
  await deck.save();
  res.status(200).json({
    status: 'success',
    data: deck,
  });
});

exports.updateLife = catchAsync(async (req, res, next) => {
  const { opponentUserId, opponentCharacterId, newLife } = req.body;
  const deck = await Deck.findOne({ playerChallenger: opponentUserId }).sort({
    creationDate: -1,
  });
  console.log(JSON.stringify(deck));
  const character = deck.characters.find(
    (char) => String(char.character) === String(opponentCharacterId),
  );
  console.log(character.current_health);
  console.log(JSON.stringify(character));
  if (!character) {
    return next(new AppError('No character found with that ID', 404));
  }
  character.current_health = newLife;
  await deck.save();

  res.status(200).json({
    status: 'success',
    data: deck,
  });
});

exports.getOpponentCharacterCurrentLife = catchAsync(async (req, res, next) => {
  const { characterId, id } = req.params;
  const opponentUserId = await getOpponentUserID(id);
  const deck = await Deck.findOne({ playerChallenger: opponentUserId }).sort({
    creationDate: -1,
  });
  const character = deck.characters.find(
    (char) => String(char.character) === String(characterId),
  );
  if (!character) {
    return next(new AppError('No character found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: character.current_health,
  });
});
