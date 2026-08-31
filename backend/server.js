require('dotenv').config();
const express = require('express');
const cors = require('cors');
const questdb = require('./db/questdb');

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

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date(), 
    database: questdb.getStatus()
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

// Start QuestDB connection & server launch
const startServer = async () => {
  await questdb.initDB();

  app.listen(PORT, () => {
    console.log(`LottoScan Backend server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Auto-scrape on startup (delayed 5s to let server settle)
  setTimeout(async () => {
    try {
      const scraper = require('./services/scraper');
      console.log('[Server] Running initial live scrape...');
      const result = await scraper.scrapeLivePrizes();
      console.log(`[Server] Initial scrape complete: ${result.count || 0} lotteries, NLB=${result.nlbScraped}, DLB=${result.dlbScraped}`);
    } catch (err) {
      console.warn('[Server] Initial scrape failed (will retry in 30min):', err.message);
    }
  }, 5000);

  // Re-scrape every 30 minutes
  setInterval(async () => {
    try {
      const scraper = require('./services/scraper');
      console.log('[Server] Periodic scrape starting...');
      const result = await scraper.scrapeLivePrizes();
      console.log(`[Server] Periodic scrape done: ${result.count || 0} lotteries`);
    } catch (err) {
      console.warn('[Server] Periodic scrape failed:', err.message);
    }
  }, 30 * 60 * 1000);
};

startServer();
