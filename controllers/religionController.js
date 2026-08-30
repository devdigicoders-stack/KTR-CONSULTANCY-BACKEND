const Religion = require('../models/Religion');

// @desc    Create a new religion
// @route   POST /api/religions
exports.createReligion = async (req, res) => {
  try {
    const { religionName } = req.body;
    
    if (!religionName) {
      return res.status(400).json({ success: false, message: 'Religion Name is required' });
    }

    const newReligion = await Religion.create({ religionName });

    res.status(201).json({
      success: true,
      message: 'Religion created successfully',
      data: newReligion
    });
  } catch (error) {
    console.error('Error creating religion:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Religion already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all religions
// @route   GET /api/religions
exports.getAllReligions = async (req, res) => {
  try {
    const religions = await Religion.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: religions });
  } catch (error) {
    console.error('Error fetching religions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get religion by ID
// @route   GET /api/religions/:id
exports.getReligionById = async (req, res) => {
  try {
    const religion = await Religion.findById(req.params.id);
    if (!religion) {
      return res.status(404).json({ success: false, message: 'Religion not found' });
    }
    res.status(200).json({ success: true, data: religion });
  } catch (error) {
    console.error('Error fetching religion:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update religion
// @route   PUT /api/religions/:id
exports.updateReligion = async (req, res) => {
  try {
    const { religionName } = req.body;

    const updatedReligion = await Religion.findByIdAndUpdate(
      req.params.id,
      { religionName },
      { new: true, runValidators: true }
    );

    if (!updatedReligion) {
      return res.status(404).json({ success: false, message: 'Religion not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Religion updated successfully',
      data: updatedReligion
    });
  } catch (error) {
    console.error('Error updating religion:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Religion name already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete religion
// @route   DELETE /api/religions/:id
exports.deleteReligion = async (req, res) => {
  try {
    const religion = await Religion.findByIdAndDelete(req.params.id);
    if (!religion) {
      return res.status(404).json({ success: false, message: 'Religion not found' });
    }
    res.status(200).json({ success: true, message: 'Religion deleted successfully' });
  } catch (error) {
    console.error('Error deleting religion:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
