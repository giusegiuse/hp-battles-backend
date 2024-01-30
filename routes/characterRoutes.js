const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const authController = require('./../controllers/authController');
const cleanCache = require('../controllers/cacheController');

//router.use(authController.protect);

router
  .route('/')
  .get(characterController.getAllCharacters)
  .post(characterController.createCharacter);

router.route('/select-character').get(characterController.getCharacter);

router
  .route('/top-strength')
  .get(
    characterController.aliasTopCharacters,
    characterController.getAllCharacters,
  );

router.route('/character-stats').get(characterController.getCharacterStats);
router
  .route('/birth-statistics')
  .get(characterController.getCharactersBirthDateStatistics);

router
  .route('/:id')
  .get(characterController.getCharacter)
  .patch(
    authController.restrictTo('admin'),
    cleanCache,
    characterController.updateCharacter,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    cleanCache,
    characterController.deleteCharacter,
  );

module.exports = router;
