const ClassSection = require('../models/ClassSection');

// @desc    Create or update class section mapping
// @route   POST /api/class-sections
exports.relateClassSection = async (req, res) => {
  try {
    const { className, sections } = req.body;
    
    if (!className) {
      return res.status(400).json({ success: false, message: 'Class Name is required' });
    }

    // Upsert the mapping (update if exists, create if not)
    const updatedMapping = await ClassSection.findOneAndUpdate(
      { className },
      { sections: sections || [] },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Class and Sections related successfully',
      data: updatedMapping
    });
  } catch (error) {
    console.error('Error relating class section:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all class section mappings
// @route   GET /api/class-sections
exports.getAllClassSections = async (req, res) => {
  try {
    const mappings = await ClassSection.find().sort({ className: 1 });
    res.status(200).json({ success: true, data: mappings });
  } catch (error) {
    console.error('Error fetching class sections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get sections by Class Name
// @route   GET /api/class-sections/:className
exports.getClassSectionByName = async (req, res) => {
  try {
    const mapping = await ClassSection.findOne({ className: req.params.className });
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping not found for this class' });
    }
    res.status(200).json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error fetching class section mapping:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete class section mapping
// @route   DELETE /api/class-sections/:id
exports.deleteClassSection = async (req, res) => {
  try {
    const mapping = await ClassSection.findByIdAndDelete(req.params.id);
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping not found' });
    }
    res.status(200).json({ success: true, message: 'Mapping deleted successfully' });
  } catch (error) {
    console.error('Error deleting class section mapping:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
