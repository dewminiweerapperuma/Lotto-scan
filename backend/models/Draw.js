const mongoose = require('mongoose');

const prizeTierSchema = new mongoose.Schema({
  numbers: {
    type: [Number],
    required: true
  },
  prize: {
    type: Number,
    required: true
  }
}, { _id: false });

const drawSchema = new mongoose.Schema({
  drawDate: {
    type: Date,
    required: true
  },
  drawName: {
    type: String,
    required: true
  },
  drawNumber: {
    type: String,
    required: true,
    unique: true
  },
  prizeDistribution: {
    first: {
      type: prizeTierSchema,
      required: true
    },
    second: {
      type: prizeTierSchema,
      required: true
    },
    third: {
      type: prizeTierSchema,
      required: true
    },
    fourth: {
      type: prizeTierSchema,
      required: true
    }
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
});

module.exports = mongoose.model('Draw', drawSchema);
