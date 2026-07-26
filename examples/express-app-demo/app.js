const express = require('express');
const createRateLimiter = require('../../src/middleware/rateLimitMiddleware');
const config = require('../../src/config/rateLimitConfig.json');

const app = express();

app.use(createRateLimiter(config));

app.get('/api/login', (req, res) => {
  res.json({ message: 'Login endpoint hit' });
});

app.get('/api/upload', (req, res) => {
  res.json({ message: 'Upload endpoint hit' });
});

app.get('/api/payments', (req, res) => {
  res.json({ message: 'Payments endpoint hit' });
});

app.get('/api/billing', (req, res) => {
  res.json({ message: 'Billing endpoint hit' });
});

app.get('/api/random', (req, res) => {
  res.json({ message: 'Unmatched route, uses default strategy' });
});

app.listen(3000, () => {
  console.log('Demo app listening on http://localhost:3000');
});