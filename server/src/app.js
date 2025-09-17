const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../config.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.use('/api', routes);
app.get('/health', (req, res) => res.json({ ok: true }));
app.use(errorHandler);

module.exports = app;
