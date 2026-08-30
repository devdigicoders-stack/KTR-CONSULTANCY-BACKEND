const mongoose = require('mongoose');

const committeeSchema = new mongoose.Schema({
  committeeType: { 
    type: String, 
    required: true,
    trim: true
  },
  designation: { 
    type: String, 
    required: true,
    trim: true
  },
  roleType: { 
    type: String, 
    enum: ['Employee', 'Student', 'Other'],
    required: true 
  },
  activeStatus: { 
    type: Boolean, 
    default: false 
  },
  memberName: { 
    type: String, 
    required: true,
    trim: true
  },
  fromDate: { 
    type: Date 
  },
  toDate: { 
    type: Date 
  }
}, { timestamps: true });

module.exports = mongoose.model('Committee', committeeSchema);
