const mongoose = require('mongoose');

const schoolGlobalDetailSchema = new mongoose.Schema({
  schoolName: { type: String, required: true },
  schoolAddress: { type: String },
  schoolAddress2: { type: String },
  schoolShortName: { type: String },
  contactNo: { type: String },
  mobile: { type: String },
  secondaryContactNo: { type: String },
  emailId: { type: String },
  supportEmailId: { type: String },
  website: { type: String },
  prefix: { type: String },
  isoDetails: { type: String },
  establishmentCode: { type: String },
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
  schoolCategory: { type: String },
  uDiseRegistrationNo: { type: String },
  facebookId: { type: String },
  supportTime: { type: String },
  supportDays: { type: String },
  isMainSchool: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('SchoolGlobalDetail', schoolGlobalDetailSchema);
