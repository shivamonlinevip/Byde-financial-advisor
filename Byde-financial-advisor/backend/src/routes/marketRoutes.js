const express = require('express');
const marketController = require('../controllers/marketController');
const authenticate = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/market/stocks:
 *   get:
 *     summary: Get latest stock prices and fundamentals
 *     tags: [Market]
 *     responses:
 *       200:
 *         description: Stock data
 */
router.get('/stocks', marketController.getStocks);

/**
 * @swagger
 * /api/market/economy:
 *   get:
 *     summary: Get macroeconomic and sector indicators
 *     tags: [Market]
 *     responses:
 *       200:
 *         description: Economic indicators
 */
router.get('/economy', marketController.getEconomy);

/**
 * @swagger
 * /api/market/news:
 *   get:
 *     summary: Get latest financial news with sentiment
 *     tags: [Market]
 *     responses:
 *       200:
 *         description: News articles
 */
router.get('/news', marketController.getNews);

module.exports = router;
