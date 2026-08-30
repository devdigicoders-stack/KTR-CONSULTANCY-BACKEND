const Wing = require('../models/Wing');

// @desc    Create a new wing
// @route   POST /api/wings
exports.createWing = async (req, res) => {
  try {
    const { wingName } = req.body;
    
    if (!wingName) {
      return res.status(400).json({ success: false, message: 'Wing Name is required' });
    }

    const newWing = await Wing.create({ wingName });

    res.status(201).json({
      success: true,
      message: 'Wing created successfully',
      data: newWing
    });
  } catch (error) {
    console.error('Error creating wing:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Wing already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all wings
// @route   GET /api/wings
exports.getAllWings = async (req, res) => {
  try {
    const wings = await Wing.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: wings });
  } catch (error) {
    console.error('Error fetching wings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get wing by ID
// @route   GET /api/wings/:id
exports.getWingById = async (req, res) => {
  try {
    const wing = await Wing.findById(req.params.id);
    if (!wing) {
      return res.status(404).json({ success: false, message: 'Wing not found' });
    }
    res.status(200).json({ success: true, data: wing });
  } catch (error) {
    console.error('Error fetching wing:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update wing
// @route   PUT /api/wings/:id
exports.updateWing = async (req, res) => {
  try {
    const { wingName } = req.body;

    const updatedWing = await Wing.findByIdAndUpdate(
      req.params.id,
      { wingName },
      { new: true, runValidators: true }
    );

    if (!updatedWing) {
      return res.status(404).json({ success: false, message: 'Wing not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Wing updated successfully',
      data: updatedWing
    });
  } catch (error) {
    console.error('Error updating wing:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Wing name already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete wing
// @route   DELETE /api/wings/:id
exports.deleteWing = async (req, res) => {
  try {
    const wing = await Wing.findByIdAndDelete(req.params.id);
    if (!wing) {
      return res.status(404).json({ success: false, message: 'Wing not found' });
    }
    res.status(200).json({ success: true, message: 'Wing deleted successfully' });
  } catch (error) {
    console.error('Error deleting wing:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
