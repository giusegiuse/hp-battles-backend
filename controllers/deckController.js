const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const Deck = require('./../models/deck');
const characterController = require('../controllers/characterController');
const Character = require('../models/character');

exports.create = catchAsync(async (req, res, next) => {
  if (!req.body) {
    //todo ERRORE
  }
  const deck = await Deck.create({ playerChallenger: req.body.userId });
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
