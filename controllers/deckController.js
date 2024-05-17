const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const Deck = require('./../models/deck');
const Character = require('../models/character');
const CharacterController = require('./characterController');

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
    _id: { $in: deck.characters },
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
  const deck = await Deck.findOne().sort({ creationDate: -1 });
  const character = await Character.findOne({ _id: req.body.id });
  if (!character) {
    return next(new AppError('No character found with that ID', 404));
  }
  if (deck.money < character.cost) {
    return next(new AppError('Not enough money in the deck', 400));
  }
  deck.characters.push(req.body.id);
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
