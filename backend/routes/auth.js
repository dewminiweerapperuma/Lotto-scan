const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agent = require('../models/Agent');
const { authenticate } = require('../middleware/auth');

// Seed default demo agent on startup
setTimeout(async () => {
  try {
    await Agent.seedDefaultAgent(User);
  } catch (err) {
    console.warn('[Agent Seed Error]:', err.message);
  }
}, 1500);

// Helper to generate JWT
const generateToken = (user, agent = null) => {
  return jwt.sign(
    {
      id: user.id || user._id,
      role: user.role,
      agentId: agent?.id || user.id,
      agencyName: agent?.agencyName,
      agentCode: agent?.agentCode
    },
    process.env.JWT_SECRET || 'your_secret_key_here_must_be_long_and_secure',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new standard user or agent
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, agencyName, agentCode, phone, boardAffiliation, location } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // If agent, check agentCode uniqueness
    if (role === 'agent' && agentCode) {
      const existingAgent = await Agent.findByAgentCode(agentCode);
      if (existingAgent) {
        return res.status(400).json({ message: 'An agency with this Dealer Code already exists.' });
      }
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role: role || 'user'
    });

    let agentProfile = null;
    if (role === 'agent') {
      agentProfile = await Agent.create({
        userId: user.id,
        agencyName: agencyName || 'Authorized Lottery Agency',
        agentCode: agentCode || `AGN-${Date.now().toString().slice(-4)}`,
        email: user.email,
        phone: phone || '',
        boardAffiliation: boardAffiliation || 'BOTH',
        location: location || 'Colombo'
      });
    }

    const token = generateToken(user, agentProfile);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        agencyName: agentProfile?.agencyName,
        agentCode: agentProfile?.agentCode,
        phone: agentProfile?.phone,
        boardAffiliation: agentProfile?.boardAffiliation,
        location: agentProfile?.location
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
});

// @route   POST /api/auth/agent/register
// @desc    Dedicated registration for lottery agency dealers
// @access  Public
router.post('/agent/register', async (req, res) => {
  req.body.role = 'agent';
  return router.handle(req, res);
});

// @route   POST /api/auth/login
// @desc    Authenticate user/agent with email or agentCode and get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, agentCode, identifier } = req.body;
    const loginIdentifier = identifier || email || agentCode;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Please provide email or agent code, and password.' });
    }

    // Check if user exists by email or agent code
    const user = await User.findByEmailOrCode(loginIdentifier);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User or Agent does not exist.' });
    }

    // Verify password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    // Fetch agent profile if user is agent
    let agentProfile = user.agentProfile || null;
    if (user.role === 'agent' && !agentProfile) {
      agentProfile = await Agent.findByUserId(user.id);
    }

    const token = generateToken(user, agentProfile);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        agencyName: agentProfile?.agencyName,
        agentCode: agentProfile?.agentCode,
        phone: agentProfile?.phone,
        boardAffiliation: agentProfile?.boardAffiliation,
        location: agentProfile?.location
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
});

// @route   POST /api/auth/agent/login
// @desc    Alias route for agent login
// @access  Public
router.post('/agent/login', async (req, res) => {
  return router.handle(req, res);
});

// @route   GET /api/auth/me
// @desc    Get current logged in user and agency profile
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    let agentProfile = null;
    if (user.role === 'agent') {
      agentProfile = await Agent.findByUserId(user.id);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        agencyName: agentProfile?.agencyName,
        agentCode: agentProfile?.agentCode,
        phone: agentProfile?.phone,
        boardAffiliation: agentProfile?.boardAffiliation,
        location: agentProfile?.location
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error fetching user profile.' });
  }
});

module.exports = router;
