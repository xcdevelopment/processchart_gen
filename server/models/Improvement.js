// server/models/Improvement.js
const mongoose = require('mongoose');

const ImprovementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'タイトルは必須です'],
    trim: true,
    maxlength: [200, 'タイトルは200文字以内にしてください']
  },
  description: {
    type: String,
    required: [true, '説明は必須です'],
    trim: true
  },
  targetStepType: {
    type: String,
    enum: ['process', 'inspection', 'transport', 'delay', 'storage', ''],
    default: ''
  },
  keywords: {
    type: [String],
    default: []
  },
  timeReductionPercent: {
    type: Number,
    required: [true, '時間削減率は必須です'],
    min: [0, '削減率は0%以上にしてください'],
    max: [100, '削減率は100%以下にしてください']
  },
  implementationDifficulty: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  estimatedCost: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Improvement', ImprovementSchema);