const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updateProfile } = require('../validators/userValidator');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.put('/profile', validate(updateProfile), userController.updateProfile);

/**
 * @swagger
 * /api/user/profile:
 *   delete:
 *     summary: Delete the current user's account
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.delete('/profile', userController.deleteProfile);

module.exports = router;
