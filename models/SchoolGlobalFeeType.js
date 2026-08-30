const mongoose = require('mongoose');

const schoolGlobalFeeTypeSchema = new mongoose.Schema({
  feeType: { type: String, required: true },
  schoolName: { type: String, required: true },
  schoolAddress: { type: String },
  schoolAddress2: { type: String },
  schoolShortName: { type: String },
  contactNo: { type: String },
  mobile: { type: String },
  email: { type: String },
  supportEmailId: { type: String },
  website: { type: String },
  prefix: { type: String },
  receiptSettings: { type: String },
  schoolNo: { type: String },
  affiliationTo: { type: String },
  affiliationNo: { type: String },
  associates: { type: String },
  renewUpto: { type: String },
  schoolStatus: { type: String },
  city: { type: String },
  eCareMobileNo: { type: String },
  workingDays: { type: String },
  recess: { type: String },
  totalPeriod: { type: String },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('SchoolGlobalFeeType', schoolGlobalFeeTypeSchema);
