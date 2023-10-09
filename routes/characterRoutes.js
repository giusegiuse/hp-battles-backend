const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const authController = require('./../controllers/authController');

router.use(authController.protect);

router
  .route('/')
  .get(characterController.getAllCharacters)
  .post(
    authController.restrictTo('admin'),
    characterController.createCharacter,
  );

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
    characterController.updateCharacter,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    characterController.deleteCharacter,
  );
module.exports = router;
