const mongoose = require('mongoose');

const cibilReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  pan: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  bureau: {
    type: String,
    required: true,
  },
  score: {
    type: String,
    default: null,
  },
  pdfLink: {
    type: String,
    default: null,
  },
  paymentId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'notFound', 'failed'],
  },
  message: {
    type: String,
    default: null,
  },
  client_id: {
    type: String,
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('CibilReport', cibilReportSchema);
