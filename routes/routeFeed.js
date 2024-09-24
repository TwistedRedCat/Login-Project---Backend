const express = require('express');
const { body } = require('express-validator/check');

const User = require('../models/user');
const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /feed/posts
// router.get("/posts", isAuth, feedController.getPosts);

// POST /feed/post
router.post('/signUp/checkEmail', feedController.checkEmail);
router.post(
  '/signUp/submit',
  [
    body('email')
      .isEmail()
      .trim()
      .isLength({ min: 3 })
      .normalizeEmail({ gmail_lowercase: true, gmail_remove_dots: false }),
    body('password')
      .trim()
      .isLength({ min: 3 })
      .matches(/^[a-zA-Z]+$/)
      .escape(),
  ],
  feedController.submit
);

router.post('/authenticate', feedController.postCode);
router.get('/login', feedController.getLogin);
router.post('/login', feedController.postLogin);

// .custom(async (value) => {
//   const result = await User.findOne({ email: email });
//   if (result) {
//     const err = new Error("User already exist");
//     throw err;
//   }
// })

// router.post(
//   "/post",
//   isAuth,
//   [
//     body("title").trim().isLength({ min: 5 }),
//     body("content").trim().isLength({ min: 5 }),
//   ],
//   feedController.createPost
// );

// router.get("/post/:postId", isAuth, feedController.getPost);

// router.put(
//   "/post/:postId",
//   isAuth,
//   [
//     body("title").trim().isLength({ min: 5 }),
//     body("content").trim().isLength({ min: 5 }),
//   ],
//   feedController.updatePost
// );

// router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
