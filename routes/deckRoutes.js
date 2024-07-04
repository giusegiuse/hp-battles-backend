const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');

router.route('/').get();

router.route('/characters/:userId').get(deckController.getDeckCharacters);
router
  .route('/opponentCharacters/:userId')
  .get(deckController.getOppenentDeckCharacters);
router.route('/create').post(deckController.create);
router.route('/addCharacter').post(deckController.addCharacter);
router
  .route('/removeCharacter/:characterId')
  .delete(deckController.removeCharacter);
router
  .route('/:id/opponent-current-life/character/:characterId/')
  .get(deckController.getOpponentCharacterCurrentLife);
router.route('/character/update-life').post(deckController.updateLife);

module.exports = router;
