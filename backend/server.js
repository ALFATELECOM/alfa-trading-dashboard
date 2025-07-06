const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

// In-memory storage
let users = [];
let orders = [];
let positions = [];
let balances = new Map();

// Mock market data
const mockPrices = {
  'RELIANCE': 2850.75,
  'TCS': 3420.50,
  'HDFC': 1650.25,
  'INFY': 1890.80,
  'ICICIBANK': 1050.30,
  'SBIN': 720.45,
  'BHARTIARTL': 1180.90,
  'ITC': 285.60,
  'KOTAKBANK': 1890.75,
  'LT': 3450.20
};

// Utility functions
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Funds route
app.get('/api/funds/balance', (req, res) => {
  try {
    const userId = req.headers.authorization ? 
      jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET || 'fallback-secret').userId : 
      'demo';
    
    const balance = balances.get(userId) || 100000;
    
    res.json({
      success: true,
      data: {
        availableBalance: balance,
        totalBalance: balance,
        usedMargin: 0,
        availableMargin: balance,
        currency: 'INR',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch balance', 
      details: error.message 
    });
  }
});

// Trading signals route
app.get('/api/signal/entry', (req, res) => {
  try {
    const symbols = Object.keys(mockPrices);
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const price = mockPrices[randomSymbol];
    const signal = Math.random() > 0.5 ? 'BUY' : 'SELL';
    
    const entrySignal = {
      id: generateId(),
      symbol: randomSymbol,
      signal: signal,
      price: price,
      confidence: Math.floor(Math.random() * 40) + 60,
      targetPrice: signal === 'BUY' ? price * 1.03 : price * 0.97,
      stopLoss: signal === 'BUY' ? price * 0.98 : price * 1.02,
      reasoning: `Technical analysis suggests ${signal} signal based on momentum indicators`,
      timestamp: new Date().toISOString(),
      validity: '1 hour'
    };

    res.json({
      success: true,
      data: entrySignal
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate signal', 
      details: error.message 
    });
  }
});

// Paper order route
app.post('/api/order/paper', (req, res) => {
  try {
    const { symbol, type, quantity, price } = req.body;
    
    if (!symbol || !type || !quantity) {
      return res.status(400).json({ error: 'Symbol, type, and quantity are required' });
    }

    const userId = req.headers.authorization ? 
      jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET || 'fallback-secret').userId : 
      'demo';

    const orderPrice = price || mockPrices[symbol] || 100;
    const orderValue = quantity * orderPrice;
    const currentBalance = balances.get(userId) || 100000;

    if (type === 'BUY' && orderValue > currentBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const order = {
      id: generateId(),
      userId: userId,
      symbol: symbol.toUpperCase(),
      type: type.toUpperCase(),
      quantity: parseInt(quantity),
      price: orderPrice,
      status: 'EXECUTED',
      createdAt: new Date(),
      executedAt: new Date()
    };

    orders.push(order);

    // Update balance
    if (type === 'BUY') {
      balances.set(userId, currentBalance - orderValue);
    } else {
      balances.set(userId, currentBalance + orderValue);
    }

    res.json({
      success: true,
      message: 'Paper order placed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Order placement failed', 
      details: error.message 
    });
  }
});

// Market data route
app.get('/api/market/prices', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockPrices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch market prices', 
      details: error.message 
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ALFA Trading Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
