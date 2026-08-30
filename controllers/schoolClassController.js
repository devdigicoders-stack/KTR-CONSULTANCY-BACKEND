const SchoolClass = require('../models/SchoolClass');

// @desc    Create a new class
// @route   POST /api/school-classes
exports.createSchoolClass = async (req, res) => {
  try {
    const { className, wingName, schoolName, orderNo } = req.body;
    
    if (!className || !wingName || !schoolName || orderNo === undefined) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newClass = await SchoolClass.create({
      className,
      wingName,
      schoolName,
      orderNo
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all classes
// @route   GET /api/school-classes
exports.getAllSchoolClasses = async (req, res) => {
  try {
    const classes = await SchoolClass.find().sort({ orderNo: 1 });
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get class by ID
// @route   GET /api/school-classes/:id
exports.getSchoolClassById = async (req, res) => {
  try {
    const schoolClass = await SchoolClass.findById(req.params.id);
    if (!schoolClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, data: schoolClass });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update class
// @route   PUT /api/school-classes/:id
exports.updateSchoolClass = async (req, res) => {
  try {
    const updatedClass = await SchoolClass.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass
    });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete class
// @route   DELETE /api/school-classes/:id
exports.deleteSchoolClass = async (req, res) => {
  try {
    const schoolClass = await SchoolClass.findByIdAndDelete(req.params.id);
    if (!schoolClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
