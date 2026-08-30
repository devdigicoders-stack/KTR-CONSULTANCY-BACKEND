const SchoolGlobalFeeType = require('../models/SchoolGlobalFeeType');

// @desc    Create a new school detail with fee type
// @route   POST /api/school-global-fee-types
exports.createSchoolFeeType = async (req, res) => {
  try {
    const { schoolName, feeType } = req.body;
    if (!schoolName || !feeType) {
      return res.status(400).json({ success: false, message: 'School Name and Fee Type are required' });
    }

    const newEntry = await SchoolGlobalFeeType.create(req.body);

    res.status(201).json({
      success: true,
      message: 'School Global Detail with FeeType created successfully',
      data: newEntry
    });
  } catch (error) {
    console.error('Error creating school fee type detail:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all school details with fee type
// @route   GET /api/school-global-fee-types
exports.getAllSchoolFeeTypes = async (req, res) => {
  try {
    const entries = await SchoolGlobalFeeType.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    console.error('Error fetching school fee type details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get by ID
// @route   GET /api/school-global-fee-types/:id
exports.getSchoolFeeTypeById = async (req, res) => {
  try {
    const entry = await SchoolGlobalFeeType.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    console.error('Error fetching school fee type detail:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update school detail with fee type
// @route   PUT /api/school-global-fee-types/:id
exports.updateSchoolFeeType = async (req, res) => {
  try {
    const updatedEntry = await SchoolGlobalFeeType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating school fee type detail:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete school detail with fee type
// @route   DELETE /api/school-global-fee-types/:id
exports.deleteSchoolFeeType = async (req, res) => {
  try {
    const entry = await SchoolGlobalFeeType.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting school fee type detail:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
