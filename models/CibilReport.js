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
  invoiceNumber: {
    type: String,
    default: null,
  },
  pricing: {
    basePrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null }
  },
  refundDetails: {
    refundId: { type: String, default: null },
    amount: { type: Number, default: 0 },
    reason: { type: String, default: null },
    refundedAt: { type: Date, default: null },
    status: { type: String, default: null }
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'notFound', 'failed', 'refunded'],
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
