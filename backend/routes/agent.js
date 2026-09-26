const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const Employee = require('../models/Employee');
const Order = require('../models/Order');

// @route   GET /api/agent/reports/daily
// @desc    Get aggregated daily winning summary report by date
// @access  Public (or Agent/Admin)
router.get('/reports/daily', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const agentId = req.query.agentId || 'default-agent';

    const report = await Claim.getDailySummary(date, agentId);
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return res.status(500).json({ message: 'Server error generating daily report.', error: error.message });
  }
});

// Helper: convert number to words (for report note)
function numberToWords(num) {
  if (num === 0) return 'zero';
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const scales = ['', 'thousand', 'million', 'billion'];

  function convertChunk(n) {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' hundred';
      n %= 100;
      if (n > 0) str += ' and ';
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) str += '-' + ones[n];
    } else if (n > 0) {
      str += ones[n];
    }
    return str;
  }

  const intPart = Math.floor(Math.abs(num));
  const centsPart = Math.round((Math.abs(num) - intPart) * 100);

  let result = '';
  let chunkIndex = 0;
  let remaining = intPart;

  if (remaining === 0) {
    result = 'zero';
  } else {
    const chunks = [];
    while (remaining > 0) {
      const chunk = remaining % 1000;
      if (chunk > 0) {
        chunks.unshift(convertChunk(chunk) + (scales[chunkIndex] ? ' ' + scales[chunkIndex] : ''));
      }
      remaining = Math.floor(remaining / 1000);
      chunkIndex++;
    }
    result = chunks.join(' ');
  }

  let words = 'Rupees ' + result;
  if (centsPart > 0) {
    words += ' and ' + convertChunk(centsPart) + ' cents';
  }
  words += ' only';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Helper: build structured scan detail report for a specific board or all
function buildScanDetailReport({ claims, boardFilter, date, agentId, printDate, agentCode, agentName }) {
  const filteredClaims = boardFilter && boardFilter !== 'ALL'
    ? claims.filter(c => (c.board || '').toUpperCase() === boardFilter.toUpperCase())
    : claims;

  // Group by lottery name
  const lotteryMap = new Map();
  filteredClaims.forEach(c => {
    const lotteryKey = c.lotteryName || 'Unknown Lottery';
    if (!lotteryMap.has(lotteryKey)) {
      lotteryMap.set(lotteryKey, []);
    }
    lotteryMap.get(lotteryKey).push(c);
  });

  const lotteries = [];
  let grandTotalTickets = 0;
  let grandTotalAmount = 0;

  for (const [lotteryName, lotteryClaims] of lotteryMap) {
    const prizeMap = new Map();
    lotteryClaims.forEach(c => {
      const prize = parseFloat(c.prizeAmount) || 0;
      if (!prizeMap.has(prize)) {
        prizeMap.set(prize, { prize, ticketCount: 0, amount: 0 });
      }
      const tier = prizeMap.get(prize);
      tier.ticketCount += 1;
      tier.amount += prize;
    });

    const tiers = Array.from(prizeMap.values()).sort((a, b) => a.prize - b.prize);
    const subtotalTickets = tiers.reduce((sum, t) => sum + t.ticketCount, 0);
    const subtotalAmount = tiers.reduce((sum, t) => sum + t.amount, 0);

    grandTotalTickets += subtotalTickets;
    grandTotalAmount += subtotalAmount;

    lotteries.push({
      name: lotteryName,
      tiers,
      subtotalTickets,
      subtotalAmount
    });
  }

  // Sort lotteries alphabetically
  lotteries.sort((a, b) => a.name.localeCompare(b.name));

  const amountInWords = numberToWords(grandTotalAmount);
  const boardTitle = boardFilter === 'NLB'
    ? 'National Lotteries Board'
    : boardFilter === 'DLB'
      ? 'Development Lotteries Board'
      : 'All Lotteries';

  return {
    board: boardFilter || 'ALL',
    boardTitle,
    agentCode: agentCode || (boardFilter === 'DLB' ? 'DLB-AG-3092' : 'A172'),
    agentName: agentName || 'M G Thilakarathne',
    printDate,
    reportDate: date,
    lotteries,
    grandTotalTickets,
    grandTotalAmount,
    amountInWords
  };
}

// @route   GET /api/agent/reports/scan-detail
// @desc    Get lottery-wise winning report grouped by lottery name -> prize tier (Agent's Scan Detail) for NLB & DLB
// @access  Public (or Agent/Admin)
router.get('/reports/scan-detail', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const agentId = req.query.agentId || 'default-agent';
    const requestedBoard = (req.query.board || '').toUpperCase(); // 'NLB' | 'DLB' | ''

    const claims = await Claim.getClaimsByDate(date, agentId);

    // Format the print date
    const dateObj = new Date(date + 'T00:00:00');
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const printDate = `${dateObj.getFullYear()} ${months[dateObj.getMonth()]} ${String(dateObj.getDate()).padStart(2, '0')}`;

    const nlbReport = buildScanDetailReport({
      claims,
      boardFilter: 'NLB',
      date,
      agentId,
      printDate,
      agentCode: agentId === 'default-agent' ? 'A172' : agentId,
      agentName: 'M G Thilakarathne'
    });

    const dlbReport = buildScanDetailReport({
      claims,
      boardFilter: 'DLB',
      date,
      agentId,
      printDate,
      agentCode: agentId === 'default-agent' ? 'DLB-AG-3092' : agentId,
      agentName: 'M G Thilakarathne'
    });

    const activeBoard = requestedBoard === 'DLB' ? 'DLB' : 'NLB';
    const activeReport = activeBoard === 'DLB' ? dlbReport : nlbReport;

    return res.status(200).json({
      success: true,
      data: {
        ...activeReport,
        activeBoard,
        nlb: nlbReport,
        dlb: dlbReport
      }
    });
  } catch (error) {
    console.error('Scan detail report error:', error);
    return res.status(500).json({ message: 'Server error generating scan detail report.', error: error.message });
  }
});

// @route   GET /api/agent/orders
// @desc    Get 2D daily employee lottery order allocation matrix & commission summary
// @access  Public (or Agent/Admin)
router.get('/orders', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const agentId = req.query.agentId || 'default-agent';

    const matrixData = await Order.getDailyOrderMatrix(date, agentId);
    return res.status(200).json({
      success: true,
      data: matrixData
    });
  } catch (error) {
    console.error('Get daily orders error:', error);
    return res.status(500).json({ message: 'Server error retrieving daily order matrix.', error: error.message });
  }
});

// @route   POST /api/agent/orders
// @desc    Save/update daily order quantities, returns, and custom commission rates
// @access  Public (or Agent/Admin)
router.post('/orders', async (req, res) => {
  try {
    const { date, agentId, matrix, additional, returns, remaining, employeeCommissionRates } = req.body;
    const dateStr = date || new Date().toISOString().slice(0, 10);

    const savedMatrix = await Order.saveDailyOrders({
      dateStr,
      agentId: agentId || 'default-agent',
      matrix: matrix || {},
      additional: additional || {},
      returns: returns || {},
      remaining: remaining || {},
      employeeCommissionRates: employeeCommissionRates || {}
    });

    return res.status(200).json({
      success: true,
      message: 'Daily order sheet and commissions saved successfully.',
      data: savedMatrix
    });
  } catch (error) {
    console.error('Save daily orders error:', error);
    return res.status(500).json({ message: 'Server error saving daily orders.', error: error.message });
  }
});

// @route   GET /api/agent/claims
// @desc    Get all claimed winning tickets (filtered by date)
// @access  Public (or Agent/Admin)
router.get('/claims', async (req, res) => {
  try {
    const date = req.query.date;
    const agentId = req.query.agentId || 'default-agent';

    const claims = await Claim.getClaimsByDate(date, agentId);
    return res.status(200).json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (error) {
    console.error('Get claims error:', error);
    return res.status(500).json({ message: 'Server error retrieving claims.', error: error.message });
  }
});

// @route   POST /api/agent/claims
// @desc    Record a new winning ticket payout / claim
// @access  Public (or Employee/Agent/Admin)
router.post('/claims', async (req, res) => {
  try {
    const {
      agentId,
      employeeId,
      employeeName,
      lotteryName,
      board,
      drawNumber,
      drawDate,
      ticketSerial,
      matchedTier,
      prizeAmount,
      payoutStatus
    } = req.body;

    if (!lotteryName || prizeAmount === undefined) {
      return res.status(400).json({ message: 'Lottery name and prize amount are required.' });
    }

    // Duplicate Prevention: Check if this ticket serial was already claimed
    if (ticketSerial) {
      const existing = await Claim.findBySerial(ticketSerial);
      if (existing) {
        return res.status(409).json({
          message: `Ticket serial ${ticketSerial} has already been claimed on ${new Date(existing.claimedAt || existing.claimed_at).toLocaleDateString()}.`,
          alreadyClaimed: true,
          existingClaim: existing
        });
      }
    }

    // Expiration Prevention: Check if draw date is older than 6 months (approx 180 days)
    if (drawDate) {
      const cleanDateStr = String(drawDate).replace(/\//g, '-').trim().slice(0, 10);
      const drawTime = new Date(cleanDateStr + 'T00:00:00').getTime();
      if (!isNaN(drawTime)) {
        const expiryDate = new Date(drawTime);
        expiryDate.setMonth(expiryDate.getMonth() + 6);
        if (new Date() > expiryDate) {
          return res.status(400).json({
            message: `Payout Blocked: Ticket is EXPIRED. Draw was held on ${cleanDateStr} (deadline was ${expiryDate.toISOString().slice(0, 10)}). Official Sri Lanka NLB & DLB regulations state lottery winning prizes must be claimed within 6 months of draw date.`,
            isExpired: true,
            drawDate: cleanDateStr,
            expiryDate: expiryDate.toISOString().slice(0, 10)
          });
        }
      }
    }

    const newClaim = await Claim.createClaim({
      agentId,
      employeeId,
      employeeName,
      lotteryName,
      board,
      drawNumber,
      drawDate,
      ticketSerial,
      matchedTier,
      prizeAmount,
      payoutStatus: payoutStatus || 'paid'
    });

    return res.status(201).json({
      success: true,
      message: 'Winning ticket payout recorded successfully.',
      data: newClaim
    });
  } catch (error) {
    console.error('Create claim error:', error);
    return res.status(500).json({ message: 'Server error recording claim.', error: error.message });
  }
});

// @route   GET /api/agent/employees
// @desc    List all employees/counters for an agency
// @access  Public (or Agent/Admin)
router.get('/employees', async (req, res) => {
  try {
    const agentId = req.query.agentId || 'default-agent';
    const employees = await Employee.listByAgent(agentId);
    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({ message: 'Server error retrieving employees.', error: error.message });
  }
});

// @route   POST /api/agent/employees
// @desc    Add a new employee / counter to the agency with commission rate
// @access  Public (or Agent/Admin)
router.post('/employees', async (req, res) => {
  try {
    const { agentId, name, email, phone, counterName, commissionRate, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Employee name is required.' });
    }

    const employee = await Employee.create({
      agentId,
      name,
      email,
      phone,
      counterName,
      commissionRate: commissionRate !== undefined ? parseFloat(commissionRate) : 2.5,
      status
    });

    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully.',
      data: employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ message: 'Server error adding employee.', error: error.message });
  }
});

// @route   DELETE /api/agent/employees/:id
// @desc    Delete / deactivate an employee
// @access  Public (or Agent/Admin)
router.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Employee ID is required.' });
    }

    await Employee.delete(id);
    return res.status(200).json({
      success: true,
      message: 'Employee removed successfully.'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return res.status(500).json({ message: 'Server error deleting employee.', error: error.message });
  }
});

module.exports = router;

