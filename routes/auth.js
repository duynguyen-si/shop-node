const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');

const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.'),
    body(
      'password',
      'Please enter password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
  ],
  authController.postLogin
);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(
          (userDoc) => {
            if (userDoc) {
              return Promise.reject(
                'E-mail exist already, please enter a different one.'
              );
            }
          }
        );
      }),
    body(
      'password',
      'Please enter password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body(
      'confirmPassword',
      'Confirm password must be the same as password!'
    ).custom((value, { req }) => {
      return value === req.body.password;
    }),
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post(
  '/new-password',
  authController.postNewPassword
);

module.exports = router;
