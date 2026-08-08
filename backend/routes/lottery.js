const express = require('express');
const router = express.Router();
const multer = require('multer');
const Draw = require('../models/Draw');
const { authenticate, authorize } = require('../middleware/auth');

// Multer configuration for memory storage (for CSV parsing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

// Helper to match ticket numbers with winning tiers
const checkWinningTicket = (ticketNumbers, prizeDistribution) => {
  if (!Array.isArray(ticketNumbers)) {
    return { matched: false, tier: null, prize: 0, reason: 'Invalid ticket numbers format' };
  }

  // Parse strings to numbers if necessary
  const parsedTicket = ticketNumbers.map(Number).filter(num => !isNaN(num));
  const sortedTicket = [...parsedTicket].sort((a, b) => a - b);
  
  const tiers = ['first', 'second', 'third', 'fourth'];
  
  for (const tier of tiers) {
    const tierData = prizeDistribution[tier];
    if (!tierData || !tierData.numbers || tierData.numbers.length === 0) continue;
    
    const parsedTierNumbers = tierData.numbers.map(Number);
    const sortedTier = [...parsedTierNumbers].sort((a, b) => a - b);
    
    // Check for exact match (length and elements match exactly)
    const isExact = sortedTicket.length === sortedTier.length && 
                    sortedTicket.every((val, index) => val === sortedTier[index]);
    
    if (isExact) {
      return {
        matched: true,
        tier: tier,
        prize: tierData.prize,
        reason: `Exact match for ${tier} prize!`
      };
    }
    
    // Check if the winning tier numbers are completely contained within the scanned ticket numbers (subset match)
    const isSubset = sortedTier.every(num => parsedTicket.includes(num));
    if (isSubset && sortedTier.length > 0) {
      return {
        matched: true,
        tier: tier,
        prize: tierData.prize,
        reason: `All winning numbers for ${tier} prize matched!`
      };
    }
  }
  
  // Also calculate partial matches (how many numbers matched) for feedback
  let bestMatchCount = 0;
  let bestMatchTier = '';
  
  for (const tier of tiers) {
    const tierData = prizeDistribution[tier];
    if (!tierData || !tierData.numbers) continue;
    const matches = tierData.numbers.filter(num => parsedTicket.includes(Number(num))).length;
    if (matches > bestMatchCount) {
      bestMatchCount = matches;
      bestMatchTier = tier;
    }
  }

  return {
    matched: false,
    tier: null,
    prize: 0,
    reason: bestMatchCount > 0 
      ? `No prize matched. Matched ${bestMatchCount} numbers from ${bestMatchTier} prize.`
      : 'No matches found.'
  };
};

// @route   POST /api/lottery/upload-results
// @desc    Upload draw results (JSON or CSV file)
// @access  Private (Admin Only)
router.post('/upload-results', authenticate, authorize('admin'), upload.single('csvFile'), async (req, res) => {
  try {
    let drawData;

    // Handle CSV upload
    if (req.file) {
      const csvText = req.file.buffer.toString('utf8');
      const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length < 2) {
        return res.status(400).json({ message: 'CSV file is empty or missing headers.' });
      }

      // Expected CSV layout:
      // drawDate,drawName,drawNumber,firstNumbers,firstPrize,secondNumbers,secondPrize,thirdNumbers,thirdPrize,fourthNumbers,fourthPrize
      // Example: 2026-05-24,Mega Millions,MM-9982,5|12|25|31|50,15000000,10|15|20,50000,1|2,1000,9,100
      const headers = lines[0].split(',');
      const dataRow = lines[1].split(',');

      if (dataRow.length < 11) {
        return res.status(400).json({ message: 'CSV format invalid. Must include: drawDate, drawName, drawNumber, and first/second/third/fourth numbers and prizes.' });
      }

      const parseNumbers = (str) => str ? str.split('|').map(Number).filter(n => !isNaN(n)) : [];

      drawData = {
        drawDate: new Date(dataRow[0]),
        drawName: dataRow[1],
        drawNumber: dataRow[2],
        prizeDistribution: {
          first: { numbers: parseNumbers(dataRow[3]), prize: Number(dataRow[4]) },
          second: { numbers: parseNumbers(dataRow[5]), prize: Number(dataRow[6]) },
          third: { numbers: parseNumbers(dataRow[7]), prize: Number(dataRow[8]) },
          fourth: { numbers: parseNumbers(dataRow[9]), prize: Number(dataRow[10]) }
        }
      };
    } else {
      // Handle standard JSON payload
      const { drawDate, drawName, drawNumber, prizeDistribution } = req.body;
      
      if (!drawDate || !drawName || !drawNumber || !prizeDistribution) {
        return res.status(400).json({ message: 'Please provide all required fields: drawDate, drawName, drawNumber, and prizeDistribution.' });
      }
      
      drawData = {
        drawDate,
        drawName,
        drawNumber,
        prizeDistribution
      };
    }

    // Check if draw number already exists
    const existingDraw = await Draw.findOne({ drawNumber: drawData.drawNumber });
    if (existingDraw) {
      return res.status(400).json({ message: `A draw with number ${drawData.drawNumber} already exists.` });
    }

    const draw = new Draw({
      ...drawData,
      uploadedBy: req.user.id,
      status: 'active'
    });

    await draw.save();

    return res.status(201).json({
      message: 'Draw results uploaded successfully.',
      drawId: draw._id,
      draw: draw
    });
  } catch (error) {
    console.error('Upload results error:', error);
    return res.status(500).json({ message: 'Server error during draw upload.', error: error.message });
  }
});

// @route   POST /api/lottery/check-ticket
// @desc    Check scanned ticket numbers against draws
// @access  Public
router.post('/check-ticket', async (req, res) => {
  try {
    const { ticketNumbers, drawDate, drawNumber } = req.body;

    if (!ticketNumbers || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
      return res.status(400).json({ message: 'Please provide ticketNumbers as a non-empty array.' });
    }

    let drawQuery = { status: 'active' };

    // Search by draw number if provided
    if (drawNumber) {
      drawQuery.drawNumber = drawNumber;
    } else if (drawDate) {
      // Find draws on that specific date or closest to it
      const startOfDay = new Date(drawDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(drawDate);
      endOfDay.setHours(23, 59, 59, 999);
      drawQuery.drawDate = { $gte: startOfDay, $lte: endOfDay };
    }

    let draw = await Draw.findOne(drawQuery);

    // If search with specific criteria fails or no criteria given, default to the latest draw
    if (!draw) {
      draw = await Draw.findOne({ status: 'active' }).sort({ drawDate: -1 });
    }

    if (!draw) {
      return res.status(404).json({ message: 'No active draw found to verify this ticket.' });
    }

    const result = checkWinningTicket(ticketNumbers, draw.prizeDistribution);

    return res.status(200).json({
      status: result.matched ? 'WINNER' : 'NO_MATCH',
      matchedPrize: result.tier,
      prizeAmount: result.prize,
      reason: result.reason,
      draw: {
        id: draw._id,
        drawName: draw.drawName,
        drawNumber: draw.drawNumber,
        drawDate: draw.drawDate,
        prizeDistribution: draw.prizeDistribution
      },
      ticketNumbers: ticketNumbers
    });
  } catch (error) {
    console.error('Check ticket error:', error);
    return res.status(500).json({ message: 'Server error while checking ticket.', error: error.message });
  }
});

// @route   GET /api/lottery/latest-results
// @desc    Get the most recent active draw
// @access  Public
router.get('/latest-results', async (req, res) => {
  try {
    const latestDraw = await Draw.findOne({ status: 'active' }).sort({ drawDate: -1 });
    
    if (!latestDraw) {
      return res.status(404).json({ message: 'No active draws found.' });
    }

    return res.status(200).json(latestDraw);
  } catch (error) {
    console.error('Get latest results error:', error);
    return res.status(500).json({ message: 'Server error while fetching latest draw.', error: error.message });
  }
});

// @route   GET /api/lottery/all-draws
// @desc    Get all active draws sorted by date descending
// @access  Public
router.get('/all-draws', async (req, res) => {
  try {
    const draws = await Draw.find({ status: 'active' }).sort({ drawDate: -1 });
    return res.status(200).json(draws);
  } catch (error) {
    console.error('Get all draws error:', error);
    return res.status(500).json({ message: 'Server error while fetching draws.', error: error.message });
  }
});

module.exports = router;
