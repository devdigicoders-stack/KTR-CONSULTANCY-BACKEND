const mongoose = require('mongoose');

const wingSchema = new mongoose.Schema({
  wingName: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Wing', wingSchema);
