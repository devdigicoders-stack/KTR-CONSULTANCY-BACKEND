const mongoose = require('mongoose');

const schoolBoardSchema = new mongoose.Schema({
  boardName: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

module.exports = mongoose.model('SchoolBoard', schoolBoardSchema);
