// server/src/app.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const timeout = require('connect-timeout');

const routes = require('./routes'); // suas rotas /api
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ======================
// Segurança & Middleware
// ======================
app.use(helmet());
const whitelist = [
  'https://bie-okutuala.vercel.app',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501'
];

if (process.env.FRONTEND_URL) {
  whitelist.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(timeout('30s')); // timeout global
app.use(rateLimit({
  windowMs: 60000, // 1 minuto
  max: 100,
  message: "Muitas requisições, tente novamente mais tarde",
}));

// ======================
// Logging
// ======================
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ======================
// Rotas
// ======================
app.get('/', (req, res) => res.json({ status: 'ok', message: 'API running' }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));
app.use('/api', routes);

// ======================
// 404 Handler
// ======================
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: `Rota ${req.originalUrl} não encontrada`,
  });
});

// ======================
// Error Handler
// ======================
app.use(errorHandler);

module.exports = app;