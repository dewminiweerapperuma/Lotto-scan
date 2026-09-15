const express = require('express');
const router = express.Router();
const multer = require('multer');
const Draw = require('../models/Draw');
const { authenticate, authorize } = require('../middleware/auth');
const scraper = require('../services/scraper');

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

// @route   GET /api/lottery/live-prizes
// @desc    Get current daily live winning jackpot prizes for all 16 lotteries
// @access  Public
router.get('/live-prizes', async (req, res) => {
  try {
    const prizes = await scraper.getLivePrizes();
    return res.status(200).json({
      success: true,
      lastUpdated: new Date().toISOString(),
      source: 'Live NLB/DLB Feed',
      prizes
    });
  } catch (error) {
    console.error('Get live prizes error:', error);
    return res.status(500).json({ message: 'Server error while fetching live prizes.', error: error.message });
  }
});

// @route   GET /api/lottery/prize-structures
// @desc    Get live DLB prize structures scraped directly from dlb.lk
// @access  Public
router.get('/prize-structures', async (req, res) => {
  try {
    const structures = await scraper.scrapeDLBPrizeStructures();
    return res.status(200).json({
      success: true,
      lastUpdated: new Date().toISOString(),
      source: 'https://www.dlb.lk/lottery/en',
      structures
    });
  } catch (error) {
    console.error('Get prize structures error:', error);
    return res.status(500).json({ message: 'Server error while fetching prize structures.', error: error.message });
  }
});

// @route   POST /api/lottery/sync-prizes
// @desc    Trigger live re-scrape of winning prizes from NLB/DLB websites
// @access  Public (or Admin)
router.post('/sync-prizes', async (req, res) => {
  try {
    const result = await scraper.scrapeLivePrizes();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Sync live prizes error:', error);
    return res.status(500).json({ message: 'Server error while syncing live prizes.', error: error.message });
  }
});

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

    const draw = await Draw.create({
      ...drawData,
      uploadedBy: req.user ? req.user.id : null,
      status: 'active'
    });

    return res.status(201).json({
      message: 'Draw results uploaded successfully.',
      drawId: draw.id,
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
    const { ticketNumbers, drawNumber } = req.body;

    if (!ticketNumbers || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
      return res.status(400).json({ message: 'Please provide ticketNumbers as a non-empty array.' });
    }

    let draw = null;

    // Search by draw number if provided
    if (drawNumber) {
      draw = await Draw.findOne({ drawNumber, status: 'active' });
    }

    // If search with specific criteria fails or no criteria given, default to the latest draw
    if (!draw) {
      draw = await Draw.findOne({ status: 'active' });
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
        id: draw.id,
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

const ZODIAC_EQUIVALENTS = {
  'mesha': ['mesha', 'aries', '♈'],
  'vrushabha': ['vrushabha', 'taurus', '♉'],
  'mithuna': ['mithuna', 'gemini', '♊'],
  'kataka': ['kataka', 'cancer', '♋'],
  'simha': ['simha', 'leo', '♌'],
  'kanya': ['kanya', 'virgo', '♍'],
  'thula': ['thula', 'libra', '♎'],
  'vrischika': ['vrischika', 'scorpio', '♏'],
  'dhanu': ['dhanu', 'sagittarius', '♐'],
  'makara': ['makara', 'capricorn', '♑'],
  'kumbha': ['kumbha', 'aquarius', '♒'],
  'meena': ['meena', 'pisces', '♓'],
};

const isMatchingLetterOrZodiac = (userVal, drawVal) => {
  if (!userVal || !drawVal) return false;
  const u = String(userVal).trim().toLowerCase();
  const d = String(drawVal).trim().toLowerCase();

  if (u === d) return true;

  for (const equivalents of Object.values(ZODIAC_EQUIVALENTS)) {
    if (equivalents.includes(u) && equivalents.includes(d)) {
      return true;
    }
  }

  return false;
};

// @route   POST /api/lottery/check-ticket-numbers
// @desc    Check ticket numbers against scraped lottery draws (used by frontend)
// @access  Public
router.post('/check-ticket-numbers', async (req, res) => {
  try {
    const { ticket_numbers, draw_date, lottery_name, letter } = req.body;

    if (!ticket_numbers || !Array.isArray(ticket_numbers) || ticket_numbers.length === 0) {
      return res.status(400).json({ error: 'Please provide ticket_numbers as a non-empty array.' });
    }

    let ticketNums = ticket_numbers.map(Number).filter(n => !isNaN(n) && n >= 0);

    // If user provided a single multi-digit number (e.g. 6602) into a single input box
    if (ticketNums.length === 1 && ticketNums[0] >= 100) {
      const s = String(ticketNums[0]);
      ticketNums = s.split('').map(Number);
    }

    if (ticketNums.length === 0) {
      return res.status(400).json({ error: 'No valid numbers provided.' });
    }

    // 1. Try to get lottery data from in-memory scraped prizes
    const livePrizes = await scraper.getLivePrizes();

    // 2. Filter by lottery name if specified
    let candidates = livePrizes;
    if (lottery_name) {
      const filtered = livePrizes.filter(p =>
        p.name && p.name.toLowerCase().includes(lottery_name.toLowerCase())
      );
      if (filtered.length > 0) candidates = filtered;
    }

    // 3. Find best match across all candidate lotteries
    let bestResult = null;
    let bestMatchCount = -1;

    for (const lottery of candidates) {
      if (!lottery.winningNumbers || lottery.winningNumbers.length === 0) continue;

      const winNums = lottery.winningNumbers.map(Number).filter(n => !isNaN(n));
      if (winNums.length === 0) continue;

      const matched = ticketNums.filter(n => winNums.includes(n));
      const matchCount = matched.length;

      const lotteryKey = (lottery.name || '').toLowerCase();
      const matchedLetter = isMatchingLetterOrZodiac(letter, lottery.letter);

      const isBetterMatch =
        !bestResult ||
        matchCount > bestMatchCount ||
        (matchCount === bestMatchCount && matchedLetter && !bestResult.matchedLetter);

      // Check if this is a better match than what we have
      if (isBetterMatch) {
        bestMatchCount = matchCount;
        const totalWinNums = winNums.length;

        const formatRs = (amount) => `Rs. ${Number(amount).toLocaleString('en-LK')}.00`;

        let isWinner = false;
        let prizeCategory = null;
        let prizeAmount = 0;
        let prizeAmountFormatted = null;

        // Special official handling for Govisetha
        if (lotteryKey.includes('govisetha')) {
          if (matchCount === 4 && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Super Prize (Jackpot)';
            prizeAmount = lottery.topPrize || 'Rs. 60,000,000.00';
            prizeAmountFormatted = lottery.topPrize || 'Rs. 60,000,000.00';
          } else if (matchCount === 4) {
            isWinner = true;
            prizeCategory = '1st Prize (4 Numbers)';
            prizeAmount = 2000000;
            prizeAmountFormatted = 'Rs. 2,000,000.00';
          } else if (matchCount === 3 && matchedLetter) {
            isWinner = true;
            prizeCategory = '2nd Prize (Letter + 3 Numbers)';
            prizeAmount = 250000;
            prizeAmountFormatted = 'Rs. 250,000.00';
          } else if (matchCount === 3) {
            isWinner = true;
            prizeCategory = '3rd Prize (3 Numbers)';
            prizeAmount = 5000;
            prizeAmountFormatted = 'Rs. 5,000.00';
          } else if (matchCount === 2 && matchedLetter) {
            isWinner = true;
            prizeCategory = '4th Prize (Letter + 2 Numbers)';
            prizeAmount = 2000;
            prizeAmountFormatted = 'Rs. 2,000.00';
          } else if (matchCount === 2) {
            isWinner = true;
            prizeCategory = '5th Prize (2 Numbers)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (matchCount === 1 && matchedLetter) {
            isWinner = true;
            prizeCategory = '6th Prize (Letter + 1 Number)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (matchCount === 1) {
            isWinner = true;
            prizeCategory = '7th Prize (1 Number)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = '8th Prize (Letter Only)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          }
        }

        // Special official handling for Suba Dawasak
        if (lotteryKey.includes('suba dawasak') || lotteryKey.includes('subadawasak')) {
          if (matchCount === 3 && matchedLetter) {
            isWinner = true;
            prizeCategory = '1st Prize (Zodiac + 3 Numbers)';
            prizeAmount = 500000;
            prizeAmountFormatted = 'Rs. 500,000.00';
          } else if (matchCount === 3) {
            isWinner = true;
            prizeCategory = '2nd Prize (3 Numbers)';
            prizeAmount = 50000;
            prizeAmountFormatted = 'Rs. 50,000.00';
          } else if (matchCount === 4) {
            isWinner = true;
            prizeCategory = 'Special 1st Prize (4 Numbers)';
            prizeAmount = 25000;
            prizeAmountFormatted = 'Rs. 25,000.00';
          } else if (matchCount === 2 && matchedLetter) {
            isWinner = true;
            prizeCategory = '3rd Prize (Zodiac + 2 Numbers)';
            prizeAmount = 2500;
            prizeAmountFormatted = 'Rs. 2,500.00';
          } else if (matchCount === 2) {
            isWinner = true;
            prizeCategory = '4th Prize (2 Numbers)';
            prizeAmount = 1000;
            prizeAmountFormatted = 'Rs. 1,000.00';
          } else if (matchCount === 1 && matchedLetter) {
            isWinner = true;
            prizeCategory = '5th Prize (Zodiac + 1 Number)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (matchCount === 1) {
            isWinner = true;
            prizeCategory = '6th Prize (1 Number)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = '7th Prize (Zodiac Only)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          }
        }

        // Special official handling for Sasiri (DLB: 3 Numbers)
        if (lotteryKey.includes('sasiri')) {
          if (matchCount === 3) {
            isWinner = true;
            prizeCategory = '1st Prize (Any 3 Numbers)';
            const top = (lottery.topPrize && lottery.topPrize !== '-' && lottery.topPrize !== '—') ? lottery.topPrize : 'Rs. 200,000.00';
            prizeAmount = top;
            prizeAmountFormatted = top;
          } else if (matchCount === 2) {
            isWinner = true;
            prizeCategory = '2nd Prize (Any 2 Numbers)';
            prizeAmount = 400;
            prizeAmountFormatted = 'Rs. 400.00';
          } else if (matchCount === 1) {
            isWinner = true;
            prizeCategory = '3rd Prize (Any Single Number)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          }
        }

        // Special official handling for Handahana (4 Numbers + Zodiac)
        if (lotteryKey.includes('handahana')) {
          if (matchCount === 4 && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Super Prize (Zodiac and 4 Numbers Correct)';
            const top = (lottery.topPrize && lottery.topPrize !== '-' && lottery.topPrize !== '—') ? lottery.topPrize : 'Rs. 3,000,000.00';
            prizeAmount = top;
            prizeAmountFormatted = top;
          } else if (matchCount === 4) {
            isWinner = true;
            prizeCategory = '1st Prize (4 Numbers Correct)';
            prizeAmount = 1000000;
            prizeAmountFormatted = 'Rs. 1,000,000.00';
          } else if (matchCount === 3 && matchedLetter) {
            isWinner = true;
            prizeCategory = '2nd Prize (Zodiac and Any 3 Numbers Correct)';
            prizeAmount = 25000;
            prizeAmountFormatted = 'Rs. 25,000.00';
          } else if (matchCount === 3) {
            isWinner = true;
            prizeCategory = '3rd Prize (Any 3 Numbers Correct)';
            prizeAmount = 2000;
            prizeAmountFormatted = 'Rs. 2,000.00';
          } else if (matchCount === 2 && matchedLetter) {
            isWinner = true;
            prizeCategory = '4th Prize (Zodiac and Any 2 Numbers Correct)';
            prizeAmount = 500;
            prizeAmountFormatted = 'Rs. 500.00';
          } else if (matchCount === 2) {
            isWinner = true;
            prizeCategory = '5th Prize (Any 2 Numbers Correct)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (matchCount === 1 && matchedLetter) {
            isWinner = true;
            prizeCategory = '6th Prize (Zodiac and Any Number Correct)';
            prizeAmount = 120;
            prizeAmountFormatted = 'Rs. 120.00';
          } else if (matchCount === 1) {
            isWinner = true;
            prizeCategory = '7th Prize (Any Number Correct)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = '8th Prize (Zodiac Correct)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          }
        }

        // Special official handling for Ada Kotipathi, Shanida Wasanawa & Super Ball (DLB: 4 Numbers + Letter)
        if (
          lotteryKey.includes('ada kotipathi') || lotteryKey.includes('adakotipathi') ||
          lotteryKey.includes('shanida wasanawa') || lotteryKey.includes('shanidawasanawa') || lotteryKey.includes('shanida') ||
          lotteryKey.includes('super ball') || lotteryKey.includes('superball')
        ) {
          if (matchCount === 4 && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Super Prize (4 Numbers + English Letter)';
            const top = (lottery.topPrize && lottery.topPrize !== '-' && lottery.topPrize !== '—') ? lottery.topPrize : 'Rs. 50,000,000.00';
            prizeAmount = top;
            prizeAmountFormatted = top;
          } else if (matchCount === 4) {
            isWinner = true;
            prizeCategory = '1st Prize (4 Numbers)';
            prizeAmount = 2000000;
            prizeAmountFormatted = 'Rs. 2,000,000.00';
          } else if (matchCount === 3 && matchedLetter) {
            isWinner = true;
            prizeCategory = '2nd Prize (Any 3 Numbers + English Letter)';
            prizeAmount = 200000;
            prizeAmountFormatted = 'Rs. 200,000.00';
          } else if (matchCount === 3) {
            isWinner = true;
            prizeCategory = '3rd Prize (Any 3 Numbers)';
            prizeAmount = 4000;
            prizeAmountFormatted = 'Rs. 4,000.00';
          } else if (matchCount === 2 && matchedLetter) {
            isWinner = true;
            prizeCategory = '4th Prize (Any 2 Number + English Letter)';
            prizeAmount = 2000;
            prizeAmountFormatted = 'Rs. 2,000.00';
          } else if (matchCount === 2) {
            isWinner = true;
            prizeCategory = '5th Prize (Any 2 Numbers)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (matchCount === 1 && matchedLetter) {
            isWinner = true;
            prizeCategory = '6th Prize (Any one Number + English Letter)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (matchCount === 1) {
            isWinner = true;
            prizeCategory = '7th Prize (Any Single Number)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = '8th Prize (Any English Letter)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          }
        }

        // Special official handling for Lagna Wasanawa (DLB: 4 Numbers + Zodiac)
        if (lotteryKey.includes('lagna wasanawa') || lotteryKey.includes('lagnawasanawa')) {
          if (matchCount === 4 && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Super Prize (4 Numbers + Zodiac Sign)';
            const top = (lottery.topPrize && lottery.topPrize !== '-' && lottery.topPrize !== '—') ? lottery.topPrize : 'Rs. 3,000,000.00';
            prizeAmount = top;
            prizeAmountFormatted = top;
          } else if (matchCount === 4) {
            isWinner = true;
            prizeCategory = '1st Prize (4 Numbers)';
            prizeAmount = 1000000;
            prizeAmountFormatted = 'Rs. 1,000,000.00';
          } else if (matchCount === 3 && matchedLetter) {
            isWinner = true;
            prizeCategory = '2nd Prize (Any 3 Numbers + Zodiac Sign)';
            prizeAmount = 20000;
            prizeAmountFormatted = 'Rs. 20,000.00';
          } else if (matchCount === 3) {
            isWinner = true;
            prizeCategory = '3rd Prize (Any 3 Numbers)';
            prizeAmount = 2000;
            prizeAmountFormatted = 'Rs. 2,000.00';
          } else if (matchCount === 2 && matchedLetter) {
            isWinner = true;
            prizeCategory = '4th Prize (Any 2 Numbers + Zodiac Sign)';
            prizeAmount = 400;
            prizeAmountFormatted = 'Rs. 400.00';
          } else if (matchCount === 2) {
            isWinner = true;
            prizeCategory = '5th Prize (Any 2 Numbers)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (matchCount === 1 && matchedLetter) {
            isWinner = true;
            prizeCategory = '6th Prize (Any 1 Number + Zodiac Sign)';
            prizeAmount = 120;
            prizeAmountFormatted = 'Rs. 120.00';
          } else if (matchCount === 1) {
            isWinner = true;
            prizeCategory = '7th Prize (Any Single Number)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = '8th Prize (Any Zodiac Sign)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          }
        }

        // Special official handling for Dhana Nidhanaya
        if (lotteryKey.includes('dhana nidhanaya') || lotteryKey.includes('dhananidhanaya')) {
          if (matchCount === 4 && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Super Prize (Letter and 4 Numbers Correct)';
            prizeAmount = lottery.topPrize || 'Rs. 80,000,000.00';
            prizeAmountFormatted = lottery.topPrize || 'Rs. 80,000,000.00';
          } else if (matchCount === 4) {
            isWinner = true;
            prizeCategory = '1st Prize (4 Numbers Correct)';
            prizeAmount = 2000000;
            prizeAmountFormatted = 'Rs. 2,000,000.00';
          } else if (matchCount === 3 && matchedLetter) {
            isWinner = true;
            prizeCategory = '2nd Prize (Letter and Any 3 Numbers Correct)';
            prizeAmount = 200000;
            prizeAmountFormatted = 'Rs. 200,000.00';
          } else if (matchCount === 3) {
            isWinner = true;
            prizeCategory = '3rd Prize (Any 3 Numbers Correct)';
            prizeAmount = 6000;
            prizeAmountFormatted = 'Rs. 6,000.00';
          } else if (matchCount === 2 && matchedLetter) {
            isWinner = true;
            prizeCategory = '4th Prize (Letter and Any 2 Numbers Correct)';
            prizeAmount = 2000;
            prizeAmountFormatted = 'Rs. 2,000.00';
          } else if (matchCount === 2) {
            isWinner = true;
            prizeCategory = '5th Prize (Any 2 Numbers Correct)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (matchCount === 1 && matchedLetter) {
            isWinner = true;
            prizeCategory = '6th Prize (Letter and Any Number Correct)';
            prizeAmount = 120;
            prizeAmountFormatted = 'Rs. 120.00';
          } else if (matchCount === 1) {
            isWinner = true;
            prizeCategory = '7th Prize (Any Number Correct)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = '8th Prize (Letter Correct)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          }
        }

        // Special official handling for Mahajana Sampatha (6-Digit Positional Matching)
        if (lotteryKey.includes('mahajana sampatha') || lotteryKey.includes('mahajanasampatha')) {
          const tNums = ticketNums.map(Number);
          const wNums = winNums.map(Number);
          const isExact6 = tNums.length >= 6 && wNums.length >= 6 &&
            [0, 1, 2, 3, 4, 5].every(i => tNums[i] === wNums[i]);

          // Calculate matching consecutive digits from end (Right to Left)
          let matchEnd = 0;
          for (let i = 5; i >= 0; i--) {
            if (tNums[i] === wNums[i]) matchEnd++;
            else break;
          }

          // Calculate matching consecutive digits from start (Left to Right)
          let matchStart = 0;
          for (let i = 0; i < 6; i++) {
            if (tNums[i] === wNums[i]) matchStart++;
            else break;
          }

          if (isExact6 && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Super Prize (Letter and 6 Numbers Correct)';
            prizeAmount = lottery.topPrize || 'Rs. 22,000,000.00';
            prizeAmountFormatted = lottery.topPrize || 'Rs. 22,000,000.00';
          } else if (isExact6) {
            isWinner = true;
            prizeCategory = '1st Prize (6 Numbers Correct)';
            prizeAmount = 2500000;
            prizeAmountFormatted = 'Rs. 2,500,000.00';
          } else {
            // Check best prize between Right-to-Left and Left-to-Right
            let rtlPrize = 0;
            let rtlCategory = '';
            if (matchEnd === 5) { rtlPrize = 100000; rtlCategory = '2nd Prize (Last 5 Numbers Correct)'; }
            else if (matchEnd === 4) { rtlPrize = 15000; rtlCategory = '3rd Prize (Last 4 Numbers Correct)'; }
            else if (matchEnd === 3) { rtlPrize = 2000; rtlCategory = '4th Prize (Last 3 Numbers Correct)'; }
            else if (matchEnd === 2) { rtlPrize = 200; rtlCategory = '5th Prize (Last 2 Numbers Correct)'; }
            else if (matchEnd === 1) { rtlPrize = 40; rtlCategory = '6th Prize (Last Number Correct)'; }

            let ltrPrize = 0;
            let ltrCategory = '';
            if (matchStart === 5) { ltrPrize = 100000; ltrCategory = '7th Prize (First 5 Numbers Correct)'; }
            else if (matchStart === 4) { ltrPrize = 2000; ltrCategory = '8th Prize (First 4 Numbers Correct)'; }
            else if (matchStart === 3) { ltrPrize = 200; ltrCategory = '9th Prize (First 3 Numbers Correct)'; }
            else if (matchStart === 2) { ltrPrize = 80; ltrCategory = '10th Prize (First 2 Numbers Correct)'; }
            else if (matchStart === 1) { ltrPrize = 40; ltrCategory = '11th Prize (First Number Correct)'; }

            if (rtlPrize >= ltrPrize && rtlPrize > 0) {
              isWinner = true;
              prizeCategory = rtlCategory;
              prizeAmount = rtlPrize;
              prizeAmountFormatted = formatRs(rtlPrize);
            } else if (ltrPrize > 0) {
              isWinner = true;
              prizeCategory = ltrCategory;
              prizeAmount = ltrPrize;
              prizeAmountFormatted = formatRs(ltrPrize);
            } else if (matchedLetter) {
              isWinner = true;
              prizeCategory = '12th Prize (Letter Correct)';
              prizeAmount = 40;
              prizeAmountFormatted = 'Rs. 40.00';
            }
          }
        }

        // Special official handling for Supiri Dhana Sampatha (DLB: 6-Digit Positional Matching)
        if (lotteryKey.includes('supiri dhana') || lotteryKey.includes('supiridhana')) {
          const tNums = ticketNums.map(Number);
          const wNums = winNums.map(Number);
          const isExact6 = tNums.length >= 6 && wNums.length >= 6 &&
            [0, 1, 2, 3, 4, 5].every(i => tNums[i] === wNums[i]);

          // Calculate matching consecutive digits from end (Right to Left)
          let matchEnd = 0;
          for (let i = 5; i >= 0; i--) {
            if (tNums[i] === wNums[i]) matchEnd++;
            else break;
          }

          // Calculate matching consecutive digits from start (Left to Right)
          let matchStart = 0;
          for (let i = 0; i < 6; i++) {
            if (tNums[i] === wNums[i]) matchStart++;
            else break;
          }

          // Check if all 6 numbers match in any order (permutation match)
          const sortedT = [...tNums].slice(0, 6).sort((a, b) => a - b);
          const sortedW = [...wNums].slice(0, 6).sort((a, b) => a - b);
          const isAnyOrder6 = sortedT.length === 6 && sortedW.length === 6 &&
            sortedT.every((val, idx) => val === sortedW[idx]);

          if (isExact6 && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Super Prize (All 6 Numbers + Letter)';
            const top = (lottery.topPrize && lottery.topPrize !== '-' && lottery.topPrize !== '—') ? lottery.topPrize : 'Rs. 20,000,000.00';
            prizeAmount = top;
            prizeAmountFormatted = top;
          } else if (isExact6) {
            isWinner = true;
            prizeCategory = '1st Prize (All 6 numbers)';
            prizeAmount = 2500000;
            prizeAmountFormatted = 'Rs. 2,500,000.00';
          } else {
            let rtlPrize = 0;
            let rtlCategory = '';
            if (matchEnd === 5) { rtlPrize = 100000; rtlCategory = '2nd Prize (Last 5 Numbers)'; }
            else if (matchEnd === 4) { rtlPrize = 20000; rtlCategory = '3rd Prize (Last 4 Numbers)'; }
            else if (matchEnd === 3) { rtlPrize = 2000; rtlCategory = '4th Prize (Last 3 Numbers)'; }
            else if (matchEnd === 2) { rtlPrize = 200; rtlCategory = '5th Prize (Last 2 Numbers)'; }
            else if (matchEnd === 1) { rtlPrize = 40; rtlCategory = '6th Prize (Last Number)'; }

            let ltrPrize = 0;
            let ltrCategory = '';
            if (matchStart === 5) { ltrPrize = 100000; ltrCategory = '7th Prize (First 5 Numbers)'; }
            else if (matchStart === 4) { ltrPrize = 2000; ltrCategory = '8th Prize (First 4 Numbers)'; }
            else if (matchStart === 3) { ltrPrize = 200; ltrCategory = '9th Prize (First 3 Numbers)'; }
            else if (matchStart === 2) { ltrPrize = 120; ltrCategory = '10th Prize (First 2 Numbers)'; }
            else if (matchStart === 1) { ltrPrize = 40; ltrCategory = '11th Prize (First Number)'; }

            if (rtlPrize >= ltrPrize && rtlPrize > 0) {
              isWinner = true;
              prizeCategory = rtlCategory;
              prizeAmount = rtlPrize;
              prizeAmountFormatted = formatRs(rtlPrize);
            } else if (ltrPrize > 0) {
              isWinner = true;
              prizeCategory = ltrCategory;
              prizeAmount = ltrPrize;
              prizeAmountFormatted = formatRs(ltrPrize);
            } else if (isAnyOrder6) {
              isWinner = true;
              prizeCategory = 'All 6 Numbers in any order';
              prizeAmount = 500;
              prizeAmountFormatted = 'Rs. 500.00';
            } else if (matchedLetter) {
              isWinner = true;
              prizeCategory = 'English Letter';
              prizeAmount = 40;
              prizeAmountFormatted = 'Rs. 40.00';
            }
          }
        }

        // Special official handling for Mega Power (4 Numbers + 1 Super Number + Letter)
        if (lotteryKey.includes('mega power') || lotteryKey.includes('megapower')) {
          const tNums = ticketNums.map(Number);
          const wNums = winNums.map(Number);

          // The first 4 numbers are regular numbers, 5th number is Super Number
          const mainWinNums = wNums.slice(0, 4);
          const winSuperNum = wNums.length >= 5 ? wNums[4] : null;

          const mainTicketNums = tNums.slice(0, 4);
          const ticketSuperNum = tNums.length >= 5 ? tNums[4] : null;

          // Matched main numbers
          const mainMatches = mainTicketNums.filter(n => mainWinNums.includes(n)).length;
          const matchedSuperNum = (winSuperNum !== null && ticketSuperNum !== null && winSuperNum === ticketSuperNum);

          if (mainMatches === 4 && matchedSuperNum && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Mega Super Prize (Letter + Super Number + 4 Numbers Correct)';
            const top = (lottery.topPrize && lottery.topPrize !== '-' && lottery.topPrize !== '—') ? lottery.topPrize : 'Rs. 150,000,000.00';
            prizeAmount = top;
            prizeAmountFormatted = top;
          } else if (mainMatches === 4 && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Power Super Prize (Letter + 4 Numbers Correct)';
            prizeAmount = 10000000;
            prizeAmountFormatted = 'Rs. 10,000,000.00';
          } else if (mainMatches === 4 && matchedSuperNum) {
            isWinner = true;
            prizeCategory = 'Grand Super Prize (Motor Car) (Super Number + 4 Numbers Correct)';
            prizeAmount = 5000000;
            prizeAmountFormatted = 'Grand Super Prize (Motor Car)';
          } else if (mainMatches === 4) {
            isWinner = true;
            prizeCategory = '1st Prize (4 Numbers Correct)';
            prizeAmount = 2000000;
            prizeAmountFormatted = 'Rs. 2,000,000.00';
          } else if (mainMatches === 3 && matchedLetter) {
            isWinner = true;
            prizeCategory = '2nd Prize (Letter and Any 3 Numbers Correct)';
            prizeAmount = 200000;
            prizeAmountFormatted = 'Rs. 200,000.00';
          } else if (mainMatches === 3) {
            isWinner = true;
            prizeCategory = '3rd Prize (Any 3 Numbers Correct)';
            prizeAmount = 5000;
            prizeAmountFormatted = 'Rs. 5,000.00';
          } else if (mainMatches === 2 && matchedLetter) {
            isWinner = true;
            prizeCategory = '4th Prize (Letter and Any 2 Numbers Correct)';
            prizeAmount = 2000;
            prizeAmountFormatted = 'Rs. 2,000.00';
          } else if (mainMatches === 2) {
            isWinner = true;
            prizeCategory = '5th Prize (Any 2 Numbers Correct)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (mainMatches === 1 && matchedLetter) {
            isWinner = true;
            prizeCategory = '6th Prize (Letter and Any Number Correct)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (mainMatches === 1) {
            isWinner = true;
            prizeCategory = '7th Prize (Any Number Correct)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = '8th Prize (Letter Correct)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedSuperNum) {
            isWinner = true;
            prizeCategory = '9th Prize (Super Number Correct)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          }
        }

        // Special official handling for Kapruka (DLB: 4 Numbers + 1 Super Number + Letter)
        if (lotteryKey.includes('kapruka')) {
          const tNums = ticketNums.map(Number);
          const wNums = winNums.map(Number);

          const mainWinNums = wNums.slice(0, 4);
          const winSuperNum = wNums.length >= 5 ? wNums[4] : null;

          const mainTicketNums = tNums.slice(0, 4);
          const ticketSuperNum = tNums.length >= 5 ? tNums[4] : null;

          const mainMatches = mainTicketNums.filter(n => mainWinNums.includes(n)).length;
          const matchedSuperNum = (winSuperNum !== null && ticketSuperNum !== null && winSuperNum === ticketSuperNum);

          if (mainMatches === 4 && matchedSuperNum && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Super Prize (4 Numbers + English Letter + Super Number)';
            const top = (lottery.topPrize && lottery.topPrize !== '-' && lottery.topPrize !== '—') ? lottery.topPrize : 'Rs. 150,000,000.00';
            prizeAmount = top;
            prizeAmountFormatted = top;
          } else if (mainMatches === 4 && matchedSuperNum) {
            isWinner = true;
            prizeCategory = '4 Numbers + Super Number';
            prizeAmount = 10000000;
            prizeAmountFormatted = 'Rs. 10,000,000.00';
          } else if (mainMatches === 4 && matchedLetter) {
            isWinner = true;
            prizeCategory = '4 Numbers + English Letter';
            prizeAmount = 10000000;
            prizeAmountFormatted = 'Rs. 10,000,000.00';
          } else if (mainMatches === 4) {
            isWinner = true;
            prizeCategory = '1st Prize (4 Numbers)';
            prizeAmount = 2000000;
            prizeAmountFormatted = 'Rs. 2,000,000.00';
          } else if (mainMatches === 3 && matchedLetter) {
            isWinner = true;
            prizeCategory = '2nd Prize (Any 3 Numbers + English Letter)';
            prizeAmount = 200000;
            prizeAmountFormatted = 'Rs. 200,000.00';
          } else if (mainMatches === 3) {
            isWinner = true;
            prizeCategory = '3rd Prize (Any 3 Numbers)';
            prizeAmount = 4000;
            prizeAmountFormatted = 'Rs. 4,000.00';
          } else if (mainMatches === 2 && matchedLetter) {
            isWinner = true;
            prizeCategory = '4th Prize (Any 2 Numbers + English Letter)';
            prizeAmount = 2000;
            prizeAmountFormatted = 'Rs. 2,000.00';
          } else if (mainMatches === 2) {
            isWinner = true;
            prizeCategory = '5th Prize (Any 2 Numbers)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (mainMatches === 1 && matchedLetter) {
            isWinner = true;
            prizeCategory = '6th Prize (Any 1 Number + English Letter)';
            prizeAmount = 200;
            prizeAmountFormatted = 'Rs. 200.00';
          } else if (mainMatches === 1) {
            isWinner = true;
            prizeCategory = '7th Prize (Any Single Number)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = '8th Prize (Any English Letter)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          } else if (matchedSuperNum) {
            isWinner = true;
            prizeCategory = '9th Prize (Super Number)';
            prizeAmount = 40;
            prizeAmountFormatted = 'Rs. 40.00';
          }
        }

        // Special official handling for NLB Jaya (4-Digit Positional Matching + Letter)
        if (lotteryKey === 'nlb jaya' || lotteryKey.includes('nlb jaya') || lotteryKey.includes('nlbjaya')) {
          const tNums = ticketNums.map(Number);
          const wNums = winNums.map(Number);
          const isExact4 = tNums.length >= 4 && wNums.length >= 4 &&
            [0, 1, 2, 3].every(i => tNums[i] === wNums[i]);

          // Calculate matching consecutive digits from end (Right to Left)
          let matchEnd = 0;
          for (let i = 3; i >= 0; i--) {
            if (tNums[i] === wNums[i]) matchEnd++;
            else break;
          }

          // Calculate matching consecutive digits from start (Left to Right)
          let matchStart = 0;
          for (let i = 0; i < 4; i++) {
            if (tNums[i] === wNums[i]) matchStart++;
            else break;
          }

          if (isExact4 && matchedLetter) {
            isWinner = true;
            prizeCategory = '1st Prize (Letter and 4 Numbers Correct)';
            prizeAmount = 500000;
            prizeAmountFormatted = 'Rs. 500,000.00';
          } else if (isExact4) {
            isWinner = true;
            prizeCategory = '2nd Prize (4 Numbers Correct)';
            prizeAmount = 50000;
            prizeAmountFormatted = 'Rs. 50,000.00';
          } else {
            let rtlPrize = 0;
            let rtlCategory = '';
            if (matchEnd === 3) { rtlPrize = 2000; rtlCategory = '3rd Prize (Last 3 Numbers Correct)'; }
            else if (matchEnd === 2) { rtlPrize = 200; rtlCategory = '4th Prize (Last 2 Numbers Correct)'; }
            else if (matchEnd === 1) { rtlPrize = 40; rtlCategory = '5th Prize (Last Number Correct)'; }

            let ltrPrize = 0;
            let ltrCategory = '';
            if (matchStart === 3) { ltrPrize = 200; ltrCategory = '6th Prize (First 3 Numbers Correct)'; }
            else if (matchStart === 2) { ltrPrize = 80; ltrCategory = '7th Prize (First 2 Numbers Correct)'; }
            else if (matchStart === 1) { ltrPrize = 40; ltrCategory = '8th Prize (First Number Correct)'; }

            if (rtlPrize >= ltrPrize && rtlPrize > 0) {
              isWinner = true;
              prizeCategory = rtlCategory;
              prizeAmount = rtlPrize;
              prizeAmountFormatted = formatRs(rtlPrize);
            } else if (ltrPrize > 0) {
              isWinner = true;
              prizeCategory = ltrCategory;
              prizeAmount = ltrPrize;
              prizeAmountFormatted = formatRs(ltrPrize);
            } else if (matchedLetter) {
              isWinner = true;
              prizeCategory = '9th Prize (Letter Correct)';
              prizeAmount = 40;
              prizeAmountFormatted = 'Rs. 40.00';
            }
          }
        }

        // Special official handling for Jaya Sampatha (DLB: 4 Numbers in Order from Back to Forward + Letter)
        if (lotteryKey === 'jaya sampatha' || (lotteryKey.includes('jaya sampatha') && !lotteryKey.includes('nlb'))) {
          const tNums = ticketNums.map(Number);
          const wNums = winNums.map(Number);
          const isExact4 = tNums.length >= 4 && wNums.length >= 4 &&
            [0, 1, 2, 3].every(i => tNums[i] === wNums[i]);

          // Calculate matching consecutive digits from back to forward (Right to Left)
          let matchEnd = 0;
          for (let i = 3; i >= 0; i--) {
            if (tNums[i] === wNums[i]) matchEnd++;
            else break;
          }

          if (isExact4 && matchedLetter) {
            isWinner = true;
            prizeCategory = 'All 04 numbers from back to forward with English Letter';
            const top = (lottery.topPrize && lottery.topPrize !== '-' && lottery.topPrize !== '—') ? lottery.topPrize : 'Rs. 250,000.00';
            prizeAmount = top;
            prizeAmountFormatted = top;
          } else if (isExact4) {
            isWinner = true;
            prizeCategory = '04 numbers in the order from back to forward';
            prizeAmount = 50000;
            prizeAmountFormatted = 'Rs. 50,000.00';
          } else if (matchEnd >= 3) {
            isWinner = true;
            prizeCategory = 'For matching 03 numbers from back to forward';
            prizeAmount = 4000;
            prizeAmountFormatted = 'Rs. 4,000.00';
          } else if (matchEnd >= 2) {
            isWinner = true;
            prizeCategory = '02 printed numbers from back to forward';
            prizeAmount = 1000;
            prizeAmountFormatted = 'Rs. 1,000.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = 'English Letter';
            prizeAmount = 80;
            prizeAmountFormatted = 'Rs. 80.00';
          }
        }

        // Special official handling for Ada Sampatha (Pyramid 9-Digit Lottery)
        // Pyramid structure: Row 1 (2 digits) → Row 2 (3 digits) → Row 3 (4 digits) + Letter
        // Prize structure:
        //   4 Numbers + Letter Correct → Rs 250,000
        //   4 Numbers Correct (bottom row) → Rs 50,000
        //   3 Numbers Correct (middle row) → Rs 4,000
        //   2 Numbers Correct (top row) → Rs 1,000
        //   Letter Correct only → Rs 80
        if (lotteryKey.includes('ada sampatha')) {
          // winNums from DB should be 9 digits: [row1_d1, row1_d2, row2_d1, row2_d2, row2_d3, row3_d1, row3_d2, row3_d3, row3_d4]
          // ticketNums from user should also be 9 digits in the same order

          // Extract pyramid rows from winning numbers
          let winRow1, winRow2, winRow3;
          if (winNums.length >= 9) {
            winRow1 = winNums.slice(0, 2);  // top 2 digits
            winRow2 = winNums.slice(2, 5);  // middle 3 digits
            winRow3 = winNums.slice(5, 9);  // bottom 4 digits
          } else if (winNums.length >= 4) {
            // Fallback: if only 4 digits stored (bottom row), derive the pyramid
            // Bottom row → middle row: sum adjacent digits mod 10
            // Middle row → top row: sum adjacent digits mod 10
            winRow3 = winNums.slice(0, 4);
            winRow2 = [
              (winRow3[0] + winRow3[1]) % 10,
              (winRow3[1] + winRow3[2]) % 10,
              (winRow3[2] + winRow3[3]) % 10
            ];
            winRow1 = [
              (winRow2[0] + winRow2[1]) % 10,
              (winRow2[1] + winRow2[2]) % 10
            ];
          } else {
            winRow1 = [];
            winRow2 = [];
            winRow3 = winNums;
          }

          // Extract pyramid rows from ticket numbers
          let tickRow1, tickRow2, tickRow3;
          if (ticketNums.length >= 9) {
            tickRow1 = ticketNums.slice(0, 2);
            tickRow2 = ticketNums.slice(2, 5);
            tickRow3 = ticketNums.slice(5, 9);
          } else if (ticketNums.length >= 4) {
            tickRow3 = ticketNums.slice(0, 4);
            tickRow2 = [
              (tickRow3[0] + tickRow3[1]) % 10,
              (tickRow3[1] + tickRow3[2]) % 10,
              (tickRow3[2] + tickRow3[3]) % 10
            ];
            tickRow1 = [
              (tickRow2[0] + tickRow2[1]) % 10,
              (tickRow2[1] + tickRow2[2]) % 10
            ];
          } else {
            tickRow1 = [];
            tickRow2 = [];
            tickRow3 = ticketNums;
          }

          // Compare rows exactly (order matters)
          const row3Match = winRow3.length === tickRow3.length && winRow3.every((d, i) => d === tickRow3[i]);
          const row2Match = winRow2.length === tickRow2.length && winRow2.every((d, i) => d === tickRow2[i]);
          const row1Match = winRow1.length === tickRow1.length && winRow1.every((d, i) => d === tickRow1[i]);

          if (row3Match && matchedLetter) {
            isWinner = true;
            prizeCategory = 'Super Prize (4 Numbers + Letter)';
            prizeAmount = 250000;
            prizeAmountFormatted = 'Rs. 250,000.00';
          } else if (row3Match) {
            isWinner = true;
            prizeCategory = '1st Prize (4 Numbers Correct)';
            prizeAmount = 50000;
            prizeAmountFormatted = 'Rs. 50,000.00';
          } else if (row2Match) {
            isWinner = true;
            prizeCategory = '2nd Prize (3 Numbers Correct)';
            prizeAmount = 4000;
            prizeAmountFormatted = 'Rs. 4,000.00';
          } else if (row1Match) {
            isWinner = true;
            prizeCategory = '3rd Prize (2 Numbers Correct)';
            prizeAmount = 1000;
            prizeAmountFormatted = 'Rs. 1,000.00';
          } else if (matchedLetter) {
            isWinner = true;
            prizeCategory = 'Letter Prize (Letter Only)';
            prizeAmount = 80;
            prizeAmountFormatted = 'Rs. 80.00';
          }
        }

        // Sri Lankan lottery default prize tier amounts (in Rs.)
        const PRIZE_TIERS = {
          // NLB Lotteries
          'govisetha':          { second: 2000000, third: 250000, consolation: 5000 },
          'mahajana sampatha':  { second: 1000000, third: 100000, consolation: 1000 },
          'mega power':         { second: 1000000, third: 100000, consolation: 2000 },
          'dhana nidhanaya':    { second: 1000000, third: 50000,  consolation: 1000 },
          'handahana':          { second: 500000,  third: 50000,  consolation: 1000 },
          'ada sampatha':       { second: 500000,  third: 20000,  consolation: 1000 },
          'nlb jaya':           { second: 500000,  third: 20000,  consolation: 1000 },
          'suba dawasak':       { second: 200000,  third: 10000,  consolation: 1000 },
          // DLB Lotteries
          'ada kotipathi':          { second: 2000000, third: 100000, consolation: 1000 },
          'shanida wasanawa':       { second: 1000000, third: 100000, consolation: 1000 },
          'lagna wasanawa':         { second: 1000000, third: 50000,  consolation: 1000 },
          'supiri dhana sampatha':  { second: 1000000, third: 100000, consolation: 2000 },
          'super ball':             { second: 1000000, third: 100000, consolation: 1000 },
          'kapruka':                { second: 1000000, third: 50000,  consolation: 1000 },
          'sasiri':                 { second: 500000,  third: 20000,  consolation: 1000 },
          'jaya sampatha':          { second: 500000,  third: 20000,  consolation: 1000 },
        };

        const tierData = PRIZE_TIERS[lotteryKey] || { second: 1000000, third: 100000, consolation: 1000 };

        // Check if scraped prizeStructure is available for this lottery
        if (!prizeAmountFormatted && lottery.prizeStructure && Array.isArray(lottery.prizeStructure) && lottery.prizeStructure.length > 0) {
          const struct = lottery.prizeStructure;
          if (matchCount === totalWinNums && matchCount > 0) {
            const row = struct.find(r => r.combination.toLowerCase().includes(`${matchCount} number`) || r.combination.toLowerCase().includes(`all ${matchCount}`));
            isWinner = true;
            prizeCategory = 'Jackpot / 1st Prize';
            prizeAmount = row ? row.prizeAmount : (lottery.topPrize || 'Jackpot');
            prizeAmountFormatted = row ? row.prize : (lottery.topPrize || 'Jackpot');
          } else if (matchCount >= 2) {
            const row = struct.find(r => r.combination.toLowerCase().includes(`${matchCount} number`) || r.combination.toLowerCase().includes(`any ${matchCount}`));
            if (row) {
              isWinner = true;
              prizeCategory = `${matchCount} Numbers Matched (${row.combination})`;
              prizeAmount = row.prizeAmount;
              prizeAmountFormatted = row.prize;
            }
          }
        }

        // Fallback tier lookup if prizeStructure didn't match
        if (!prizeAmountFormatted) {
          if (matchCount === totalWinNums && matchCount > 0) {
            isWinner = true;
            prizeCategory = 'Jackpot (1st Prize)';
            prizeAmount = lottery.topPrize || 'Jackpot';
            prizeAmountFormatted = lottery.topPrize || 'Jackpot';
          } else if (matchCount === totalWinNums - 1 && matchCount >= 2) {
            isWinner = true;
            prizeCategory = '2nd Prize';
            prizeAmount = tierData.second;
            prizeAmountFormatted = formatRs(tierData.second);
          } else if (matchCount === totalWinNums - 2 && matchCount >= 2) {
            isWinner = true;
            prizeCategory = '3rd Prize';
            prizeAmount = tierData.third;
            prizeAmountFormatted = formatRs(tierData.third);
          } else if (matchCount >= 2) {
            isWinner = true;
            prizeCategory = 'Consolation Prize';
            prizeAmount = tierData.consolation;
            prizeAmountFormatted = formatRs(tierData.consolation);
          }
        }

        let message;
        if (isWinner) {
          message = matchCount === totalWinNums
            ? `🎉 Congratulations! All ${matchCount} numbers matched for ${lottery.name}!`
            : `🎉 ${matchCount} of ${totalWinNums} numbers matched for ${lottery.name} — ${prizeCategory}!`;
        } else {
          message = `${matchCount} of ${totalWinNums} numbers matched for ${lottery.board || ''} ${lottery.name || ''}. Better luck next time!`;
        }

        bestResult = {
          isWinner,
          ticketNumbers: ticketNums,
          winningNumbers: winNums,
          matchedNumbers: matched,
          matchedCount: matchCount,
          matchedLetter: matchedLetter,
          userLetter: letter || '',
          lotteryName: `${lottery.board || ''} ${lottery.name || ''}`.trim(),
          drawNumber: lottery.drawNumber || '',
          drawDate: draw_date || new Date().toISOString().slice(0, 10),
          prizeAmount: prizeAmount,
          prizeAmountFormatted: prizeAmountFormatted,
          prizeCategory: prizeCategory,
          letter: lottery.letter || '',
          message,
        };

        // If jackpot match found, stop searching
        if (matchCount === totalWinNums) break;
      }
    }

    if (!bestResult) {
      return res.status(200).json({
        isWinner: false,
        ticketNumbers: ticketNums,
        winningNumbers: [],
        matchedNumbers: [],
        matchedCount: 0,
        lotteryName: lottery_name || 'Unknown',
        drawDate: draw_date || new Date().toISOString().slice(0, 10),
        message: 'No lottery draw data available to check against. Please try again later.',
      });
    }

    return res.status(200).json(bestResult);
  } catch (error) {
    console.error('Check ticket numbers error:', error);
    return res.status(500).json({ error: 'Server error while checking ticket numbers.' });
  }
});

// @route   GET /api/lottery/latest-results
// @desc    Get the most recent active draw
// @access  Public
router.get('/latest-results', async (req, res) => {
  try {
    const latestDraw = await Draw.findOne({ status: 'active' });
    
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
    const draws = await Draw.find({ status: 'active' });
    return res.status(200).json(draws);
  } catch (error) {
    console.error('Get all draws error:', error);
    return res.status(500).json({ message: 'Server error while fetching draws.', error: error.message });
  }
});

module.exports = router;
