const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const Employee = require('../models/Employee');

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
// @desc    Add a new employee / counter to the agency
// @access  Public (or Agent/Admin)
router.post('/employees', async (req, res) => {
  try {
    const { agentId, name, email, phone, counterName, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Employee name is required.' });
    }

    const employee = await Employee.create({
      agentId,
      name,
      email,
      phone,
      counterName,
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

module.exports = router;
