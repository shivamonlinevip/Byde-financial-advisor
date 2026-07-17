const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const schemas = require('../validators/authValidator');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     responses:
 *       201:
 *         description: User registered
 */
router.post('/register', authLimiter, validate(schemas.register), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged in
 */
router.post('/login', authLimiter, validate(schemas.login), authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Rotate an access/refresh token pair
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token issued
 */
router.post('/refresh', validate(schemas.refresh), authController.refresh);

router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(schemas.resetPassword), authController.resetPassword);

module.exports = router;
