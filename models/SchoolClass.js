const mongoose = require('mongoose');

const schoolClassSchema = new mongoose.Schema({
  className: { 
    type: String, 
    required: true,
    trim: true
  },
  wingName: { 
    type: String, 
    required: true,
    trim: true
  },
  schoolName: { 
    type: String, 
    required: true,
    trim: true
  },
  orderNo: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('SchoolClass', schoolClassSchema);
