const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const portfolioRoutes = require('./portfolioRoutes');
const marketRoutes = require('./marketRoutes');
const explainRoutes = require('./explainRoutes'); // exposes /explain, /reasoning, /decision-tree itself
const simulationRoutes = require('./simulationRoutes');
const agentRoutes = require('./agentRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 200, message: 'OK', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/market', marketRoutes);
// explainRoutes defines full paths (/explain/:id, /reasoning/:id, /decision-tree/:id)
// so it is mounted at the API root rather than under a sub-prefix.
router.use('/', explainRoutes);
router.use('/simulate', simulationRoutes);
router.use('/agents', agentRoutes);

module.exports = router;
