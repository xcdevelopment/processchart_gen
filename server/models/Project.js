const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'プロジェクト名は必須です'],
    trim: true,
    maxlength: [100, 'プロジェクト名は100文字以内にしてください']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '説明は500文字以内にしてください']
  },
  processSteps: {
    type: Array,
    default: []
  },
  workloadData: {
    type: Object,
    default: null
  },
  improvementResults: {
    type: Object,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '作成者は必須です']
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

module.exports = mongoose.model('Project', ProjectSchema);