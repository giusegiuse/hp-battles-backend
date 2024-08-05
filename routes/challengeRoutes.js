const express = require('express');
const challengeController = require('./../controllers/challengeController');
const authController = require('./../controllers/authController');

// Di default ogni router ha accesso solo ai parametri dei suoi percorsi specifici
// inserendo mergeParams a true ottiene i parametri dalle altre eventuali rotte
// Ho inserito questo perchè dalla userRoutes c'è un middleware che se matcha con un percorso
// router.use('/:id/challenges', challengeRouter) => utilizza challengeRoutes.
const router = express.Router({mergeParams: true});

router.use(authController.protect);

router
    .route('/')
    .get(challengeController.getAllChallenges)
    .post(
        challengeController.setChallengeUserIds,
        challengeController.createChallenge,
    );

router
    .route('/:id/opponent-user-id')
    .get(challengeController.getOpponentUserId);
router.route('/one-player').post(challengeController.createOnePlayerChallenge);

router
    .route('/check-in-progress-challenge/:id')
    .get(challengeController.checkInProgressChallenge);

router
    .route('/delete-all-in-progress-challenges/:id')
    .delete(challengeController.deleteAllInProgressChallenges);

router
    .route('/set-challenge-winner/:id')
    .patch(challengeController.setChallengeWinner)

router
    .route('/:id')
    .get(challengeController.getChallenge)
    .delete(
        authController.restrictTo('admin'),
        challengeController.deleteChallenge,
    )
    .patch(
        authController.restrictTo('user', 'admin'),
        challengeController.updateChallenge,
    );


module.exports = router;
