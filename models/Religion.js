const mongoose = require('mongoose');

const religionSchema = new mongoose.Schema({
  religionName: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Religion', religionSchema);
