const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'admin',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notificationSettings: {
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    newClientAlerts: { type: Boolean, default: true },
    documentAlerts: { type: Boolean, default: true }
  },
  securitySettings: {
    twoFactorEnabled: { type: Boolean, default: false },
    loginAlerts: { type: Boolean, default: true }
  },
  activityLogs: [{
    action: { type: String, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
