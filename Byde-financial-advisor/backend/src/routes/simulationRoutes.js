const express = require('express');
const simulationController = require('../controllers/simulationController');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { simulate } = require('../validators/simulateValidator');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/simulate:
 *   post:
 *     summary: Run a what-if macroeconomic scenario against the user's latest portfolio
 *     tags: [Simulation]
 *     responses:
 *       200:
 *         description: Simulated outcome
 */
router.post('/', validate(simulate), simulationController.simulate);

module.exports = router;
