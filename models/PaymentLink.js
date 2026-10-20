const mongoose = require('mongoose');

const paymentLinkSchema = new mongoose.Schema({
  linkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  clientMobile: {
    type: String,
    required: true,
    trim: true,
  },
  serviceName: {
    type: String,
    required: true,
    trim: true,
  },
  serviceDetails: {
    type: String,
    default: '',
  },
  amount: {
    type: Number,
    required: true,
  },
  taxableAmount: {
    type: Number,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending',
  },
  paymentId: {
    type: String,
    default: '',
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  paidAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  paymentType: {
    type: String,
    enum: ['online_link', 'manual_invoice'],
    default: 'online_link',
  },
  paymentMode: {
    type: String,
    default: 'Online',
  },
  isManual: {
    type: Boolean,
    default: false,
  },
  referenceNumber: {
    type: String,
    default: '',
  },
  clientRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
  },
  clientEmail: {
    type: String,
    default: '',
  },
  clientPan: {
    type: String,
    default: '',
  },
  clientAddress: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('PaymentLink', paymentLinkSchema);
