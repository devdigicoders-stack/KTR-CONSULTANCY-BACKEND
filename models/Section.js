const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  sectionName: { 
    type: String, 
    required: true,
    trim: true
  },
  orderNo: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);
