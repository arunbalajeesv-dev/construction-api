'use strict';

// Load and validate environment variables first — before any import that reads process.env
const env = require('./src/config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const compression = require('compression');
const path = require('path');
const pinoHttp = require('pino-http');
const logger = require('./src/utils/logger');

const tracing = require('./src/middleware/tracing');
const versionGate = require('./src/middleware/versionGate');
const maintenanceMode = require('./src/middleware/maintenanceMode');

// v1 versioned router
const v1Router = require('./src/routes/v1');

// Legacy routes — kept live during pre-production alongside /api/v1/*
const productRoutes = require('./src/routes/products');
const cartRoutes = require('./src/routes/cart');
const homeRoutes = require('./src/routes/home');
const authRoutes = require('./src/routes/auth');
const customerRoutes = require('./src/routes/customers');
const uploadRoutes = require('./src/routes/upload');
const addressRoutes = require('./src/routes/address');
const addressLegacyRoutes = require('./src/routes/addressLegacy');
const deliveryRoutes = require('./src/routes/delivery');
const orderRoutes = require('./src/routes/orders');
const configRoutes = require('./src/routes/config');
const adminRoutes = require('./src/routes/admin');
const driverRoutes = require('./src/routes/driver');
const searchRoutes = require('./src/routes/search');
const categoriesRoutes = require('./src/routes/categories');

const app = express();

// Static files
app.use(express.static('public'));
app.use('/admin', express.static(path.join(__dirname, 'admin-portal')));

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
// Core middleware — order matters
app.use(tracing); // W3C traceparent — must run before pino-http so genReqId can read traceId
app.use(pinoHttp({
  logger,
  // Use the W3C traceId as the pino-http request ID so every req.log.* call carries it
  genReqId: req => req.traceContext?.traceId,
  customProps: req => ({
    clientTraceId: req.traceContext?.clientTraceId || undefined,
    traceparent: req.traceContext?.traceparent || undefined,
  }),
}));
app.use(compression()); // Enable gzip compression for all responses
app.use(cors());
app.use(express.json());

// Health check — unversioned, no middleware chain
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'construction-api', version: 'v1' });
});

// v1 routes — versioned, full middleware stack (versionGate → maintenanceMode → routes)
app.use('/api/v1', versionGate, maintenanceMode, v1Router);

// Legacy routes — pre-production compat, no versioning/maintenance middleware
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/address', addressLegacyRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/config', configRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/categories', categoriesRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const log = req.log || logger;
  log.error({ err }, 'Unhandled error');
  res.status(500).json({ success: false, message: err.message });
});

app.listen(env.PORT, '0.0.0.0', () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
});
