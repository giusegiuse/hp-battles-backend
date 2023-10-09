const express = require('express');
const challengeController = require('./../controllers/challengeController');
const authController = require('./../controllers/authController');

// Di default ogni router ha accesso solo ai parametri dei suoi percorsi specifici
// inserendo mergeParams a true ottiene i parametri dalle altre eventuali rotte
// Ho inserito questo perchè dalla userRoutes c'è un middleware che se matcha con un percorso
// router.use('/:id/challenges', challengeRouter) => utilizza challengeRoutes.
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(challengeController.getAllChallenges)
  .post(
    challengeController.setChallengeUserIds,
    challengeController.createChallenge,
  );

router
  .route('/:id')
  .get(challengeController.getChallenge)
  .delete(
    authController.restrictTo('admin'),
    challengeController.deleteChallenge,
  )
  .patch(
    authController.restrictTo('admin'),
    challengeController.updateChallenge,
  );

module.exports = router;
