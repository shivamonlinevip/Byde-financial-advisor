const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const config = require('./src/config');
const logger = require('./src/utils/logger');
const routes = require('./src/routes');
const swaggerSpec = require('./src/docs/swagger');
const notFound = require('./src/middlewares/notFound');
const errorHandler = require('./src/middlewares/errorHandler');
const { apiLimiter } = require('./src/middlewares/rateLimiter');

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Body & cookies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
const morganStream = { write: (message) => logger.info(message.trim()) };
app.use(morgan(config.env === 'production' ? 'combined' : 'dev', { stream: morganStream }));

// Static (for any generated reports/exports)
app.use('/public', express.static('public'));

// Rate limiting on all /api routes
app.use('/api', apiLimiter);

// API docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Explainable Autonomous Financial Advisor API is running.',
    docs: '/api/docs',
  });
});

// 404 + centralized error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
