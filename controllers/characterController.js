const Character = require('../models/character');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

getAllCharacters = catchAsync(async (req, res, next) => {
  let queryObj = { ...req.query };
  const excludeFields = ['page', 'sort', 'limit', 'fields'];
  excludeFields.forEach((el) => delete queryObj[el]);

  const features = new APIFeatures(Character.find(), req.query)
    .filter()
    .sort()
    .limitFileds()
    .paginate();
  const characters = await features.query;

  res.status(200).json({
    status: 'success',
    results: characters.length,
    data: {
      characters,
    },
  });
});

getCharacter = catchAsync(async (req, res, next) => {
  const character = await Character.findById(req.params.id);
  if (!character) {
    return next(new AppError('Nessun personaggio trovato con questo id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      character,
    },
  });
});

createCharacter = catchAsync(async (req, res, next) => {
  const newCharacter = await Character.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      character: newCharacter,
    },
  });
});

updateCharacter = catchAsync(async (req, res, next) => {
  const character = await Character.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!character) {
    return next(new AppError('Nessun personaggio trovato con questo id', 404));
  }
  res.status(201).json({
    status: 'success',
    data: {
      character,
    },
  });
});

deleteCharacter = catchAsync(async (req, res, next) => {
  const character = await Character.findByIdAndDelete(req.params.id);
  if (!character) {
    return next(new AppError('Nessun personaggio trovato con questo id', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

aliasTopCharacters = async (req, res, next) => {
  req.query.limit = '3';
  req.query.sort = 'cost';
  req.query.fields = 'name, strength, life, cost';
  req.query.page = '1';
  next();
};

getCharactersStats = catchAsync(async (req, res, next) => {
  const stats = await Character.aggregate([
    {
      $match: { cost: { $gte: 60 } },
    },
    {
      $group: {
        _id: { $toUpper: '$faction' },
        avgCost: { $avg: '$cost' },
        avgLife: { $avg: '$life' },
        avgStrength: { $avg: '$strength' },
        minCost: { $min: '$cost' },
        maxCost: { $max: '$cost' },
        minStrength: { $min: '$strength' },
        maxStrength: { $max: '$strength' },
        minLife: { $min: '$life' },
        maxLife: { $max: '$life' },
        numCharacter: { $sum: 1 },
      },
    },
    {
      $sort: { avgCost: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

getCharactersBirthDateStatistics = catchAsync(async (req, res, next) => {
  const plan = await Character.aggregate([
    {
      $group: {
        _id: { $month: '$birthDate' },
        numCharacters: { $sum: 1 },
        character: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, //per non mostrare l'id
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

module.exports = {
  createCharacter,
  getAllCharacters,
  getCharacter,
  updateCharacter,
  deleteCharacter,
  aliasTopCharacters,
  getCharacterStats: getCharactersStats,
  getCharactersBirthDateStatistics,
};
