const express = require('express');
const agentController = require('../controllers/agentController');
const authenticate = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/agents/run:
 *   post:
 *     summary: Manually trigger the full agent pipeline
 *     tags: [Agents]
 *     responses:
 *       201:
 *         description: Pipeline executed
 */
router.post('/run', agentController.run);

/**
 * @swagger
 * /api/agents/status:
 *   get:
 *     summary: Get the status of the most recent pipeline run
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: Pipeline status
 */
router.get('/status', agentController.getStatus);

module.exports = router;
