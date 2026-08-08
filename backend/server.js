require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const lotteryRoutes = require('./routes/lottery');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const corsOptions = {
  origin: '*', // In production, replace with specific origins (e.g. ['http://localhost:3000'])
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Built-in body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date(), 
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/lottery', lotteryRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the server.',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// MongoDB connection options and connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lotto-scan';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB successfully connected to:', mongoUri.split('@').pop()); // print without credentials
    
    // Start listening once DB connects
    app.listen(PORT, () => {
      console.log(`LottoScan Backend server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();
