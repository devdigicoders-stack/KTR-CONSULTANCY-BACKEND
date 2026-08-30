const mongoose = require('mongoose');

const classSectionSchema = new mongoose.Schema({
  className: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  sections: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

module.exports = mongoose.model('ClassSection', classSectionSchema);
