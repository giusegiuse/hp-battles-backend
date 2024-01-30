const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const challengeRouter = require('./../routes/challengeRoutes');

const router = express.Router();

//Middleware => per questa rotta  /:userId/challenge utilizza il challengeRouter
router.use('/:id/challenges', challengeRouter);

//add middleware to check captcha validity
router.post('/signup', authController.signup);
router.post('/create', userController.createUser);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//aggiungiamo questa funzione middleware per proteggere tutte le rotte successive a questo middleware (quelle precedenti non devono essere protette).
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete('/deleteMe', userController.deleteMe);

//router.use(authController.restrictTo('admin'));

router
  .route('/:id')
  .get(userController.getUser)
  .delete(userController.deleteUser)
  .patch(userController.updateUser);

router.route('/').get(authController.protect, userController.getAllUsers);

module.exports = router;
