const express = require('express');
const explainController = require('../controllers/explainController');
const authenticate = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/explain/{recommendationId}:
 *   get:
 *     summary: Get the full transparent explanation for a recommendation
 *     tags: [Explainability]
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full explanation package
 */
router.get('/explain/:recommendationId', explainController.explain);

/**
 * @swagger
 * /api/reasoning/{recommendationId}:
 *   get:
 *     summary: Get the step-by-step reasoning timeline for a recommendation
 *     tags: [Explainability]
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reasoning timeline
 */
router.get('/reasoning/:recommendationId', explainController.reasoning);

/**
 * @swagger
 * /api/decision-tree/{recommendationId}:
 *   get:
 *     summary: Get the decision tree for a recommendation
 *     tags: [Explainability]
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Decision tree
 */
router.get('/decision-tree/:recommendationId', explainController.decisionTree);

module.exports = router;
