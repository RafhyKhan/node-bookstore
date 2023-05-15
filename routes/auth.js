const express = require('express');

const { check, body } = require('express-validator/check'); 
//to validate user inpt, deconstructuring syntax

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);


/*
Validation user input in login forum
Email is in valid syntax
Password is mininum 5 charactors, alphanumeric
*/
router.post('/login',
  [ 
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
    body('password', 'Password has to be valid.')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim()
  ], authController.postLogin);

//checks if the email is a valid email address
//this route, managaes to get an input of value=email from ejs files
/*This checcks if the email is email with isEmail()
    It will display the message you input with withMessage()
    You can create a cusotm check for specific email value and display specific errors messages
    return true makes it all work
*/
router.post('/signup', 
  [
    check('email') //check if email is valid
    .isEmail()
    .withMessage('Please enter a valid email.')
    .custom((value, {req}) => {
        //     if(value === 'test@test.com') {
        //     throw new Error('This email address is forbidden.');
        //     }
        // return true;
        return User.findOne({ email: value })  //Async Validation occurs here, return back a message
            .then(userDoc => {
                if (userDoc) {
                    Promise.reject('E-Mail exists already, please pick a different one.');
                }
          });
      })
      .normalizeEmail(),  //sanitizing, making it a proper email syntax
    body('password', 'Please enter a password with only numbers and text and at least 5 charactors.') //checks if password is in parametrs
    .isLength({min: 5})
    .isAlphanumeric()
    .trim(), //sanitizing, triming out any excess whiteSpace
    body('confirmPassword')
    .trim()
    .custom((value, { req }) => {    //checks if both passwords match
        if (value !== req.body.password) {
            throw new Error('Passwords have to match.');
        }
        return true;
    })
  ], authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
