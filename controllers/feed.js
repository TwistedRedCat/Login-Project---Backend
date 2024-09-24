const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { validationResult } = require('express-validator/check');

const Post = require('../models/post');
const User = require('../models/user');
const { type } = require('os');

exports.checkEmail = (req, res, next) => {
  const email = req.body.email;
  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        res
          .status(200)
          .json({ message: 'Email is taken.', canUseEmail: false });
      } else {
        res.status(200).json({
          message: 'E-mail can be used from backend',
          canUseEmail: true,
        });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
        err.message = err;
      }
      next(err);
    });
};

exports.submit = (req, res, next) => {
  const validationError = validationResult(req);
  const trut = validationError.isEmpty();
  const email = req.body.email;
  const password = req.body.password;
  // if (!canUseEmail) {
  //   const error = new Error("Email already exist");
  //   error.statusCode = 422;
  //   throw error;
  // }
  let exp = null;
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      if (!hashedPassword) throw new Error('Cannot hash password');
      token = (Math.floor(Math.random() * 10000) + 10000)
        .toString()
        .substring(1);
      exp = Date.now() + 65000;
      console.log(typeof exp);
      console.log('Date now is ' + Date.now());
      console.log(exp);
      const user = new User({
        email: email,
        password: hashedPassword,
        token: token,
        tokenExpirationTime: exp,
      });

      return user.save();
    })
    .then((data) => {
      crypto.randomBytes(6, (err, buffer) => {
        if (err) return;
        const token = buffer.toString('hex');
        res.status(201).json({
          message: `User ${email} created`,
          token: token,
          exp: exp,
        });
      });

      const transporter = nodemailer.createTransport({
        host: 'mail.privateemail.com',
        port: 465,
        auth: {
          user: 'dev@husin.xyz',
          pass: 'Kucing6187#',
        },
      });

      const mailData = {
        from: 'Husin <dev@husin.xyz>', // sender address
        to: email, // list of receivers
        subject: 'Sending Email using Node.js',
        text: 'Oi, whatcha doin!',
        html: `<b>Your account has been created! </b>
                   <br> Enter this 4 digit number <b style="font-size: 30px">${token}</b> to activate.<br/>`,
      };

      transporter.sendMail(mailData, (err, info) => {
        if (err) console.log(err);
        console.log('success!');
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postCode = (req, res, next) => {
  const code = req.body.code;
  const email = req.body.email;
  console.log(code);
  console.log(email);
  if (!code) {
    err = new Error('No code submitted');
    throw err;
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        console.log('user not found');
        throw new Error('No user found');
      }
      if (code !== user.token) {
        throw new Error('Wrong Code');
      }
      if (+Date.now() > +user.tokenExpirationTime) {
        throw new Error('Token Expired');
      }
      res.status(201).json({
        message: `User ${email} verified. Please login`,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(req.email);
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const err = new Error('No user found');
        err.statusCode = 401;
        throw err;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isSame) => {
      if (!isSame) {
        const err = new Error('Maybe wrong password or username');
        err.statusCode = 401;
        throw err;
      }

      const token = jwt.sign(
        { email: loadedUser.email, userId: loadedUser._id.toString() },
        'the evil red cat behind you',
        { expiresIn: '1h' }
      );
      res.status(200).json({ email: loadedUser.email, token: token });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getLogin = (req, res, next) => {
  console.log('you reached getLogin');
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return;
  }
  const token = authHeader.split(' ')[1];
  console.log(token);
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'the evil red cat behind you');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  res.status(200).json({ email: decodedToken.email });
};

// ***************For Future Use****************
// const clearImage = (filePath) => {
//   filePath = path.join(__dirname, '..', filePath);
//   fs.unlink(filePath, (err) => console.log(err));
// };
