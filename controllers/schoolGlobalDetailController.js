const SchoolGlobalDetail = require('../models/SchoolGlobalDetail');

// @desc    Create a new school detail
// @route   POST /api/school-global-details
exports.createSchool = async (req, res) => {
  try {
    const { schoolName } = req.body;
    if (!schoolName) {
      return res.status(400).json({ success: false, message: 'School Name is required' });
    }

    const newSchool = await SchoolGlobalDetail.create(req.body);

    res.status(201).json({
      success: true,
      message: 'School added successfully',
      data: newSchool
    });
  } catch (error) {
    console.error('Error creating school detail:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all school details
// @route   GET /api/school-global-details
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await SchoolGlobalDetail.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: schools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get school by ID
// @route   GET /api/school-global-details/:id
exports.getSchoolById = async (req, res) => {
  try {
    const school = await SchoolGlobalDetail.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update school detail
// @route   PUT /api/school-global-details/:id
exports.updateSchool = async (req, res) => {
  try {
    const updatedSchool = await SchoolGlobalDetail.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedSchool) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: updatedSchool
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete school detail
// @route   DELETE /api/school-global-details/:id
exports.deleteSchool = async (req, res) => {
  try {
    const school = await SchoolGlobalDetail.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    res.status(200).json({ success: true, message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
