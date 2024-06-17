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

module.exports = router;
