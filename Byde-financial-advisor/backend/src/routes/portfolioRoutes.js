const express = require('express');
const portfolioController = require('../controllers/portfolioController');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { analyze } = require('../validators/portfolioValidator');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/portfolio/analyze:
 *   post:
 *     summary: Run the full agent pipeline to generate a new portfolio recommendation
 *     tags: [Portfolio]
 *     responses:
 *       201:
 *         description: New portfolio and recommendation created
 */
router.post('/analyze', validate(analyze), portfolioController.analyze);

/**
 * @swagger
 * /api/portfolio/history:
 *   get:
 *     summary: List the user's past portfolios
 *     tags: [Portfolio]
 *     responses:
 *       200:
 *         description: Portfolio history
 */
router.get('/history', portfolioController.history);

/**
 * @swagger
 * /api/portfolio/latest:
 *   get:
 *     summary: Get the user's most recent portfolio and recommendation
 *     tags: [Portfolio]
 *     responses:
 *       200:
 *         description: Latest portfolio
 */
router.get('/latest', portfolioController.latest);

module.exports = router;
