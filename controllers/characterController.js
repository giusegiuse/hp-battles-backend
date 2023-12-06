const Character = require('../models/character');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const cache = require('../services/cache');

getAllCharacters = factory.getAll(Character);
getCharacter = factory.getOne(Character);
createCharacter = factory.createOne(Character);
updateCharacter = factory.updateOne(Character);
deleteCharacter = factory.deleteOne(Character);

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

  const cachedStats = await cacheService.handleQuery({
    query: statsQuery,
    key: 'stats',
  });

  res.status(200).json({
    status: 'success',
    data: cachedStats,
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
