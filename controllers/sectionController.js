const Section = require('../models/Section');

// @desc    Create a new section
// @route   POST /api/sections
exports.createSection = async (req, res) => {
  try {
    const { sectionName, orderNo } = req.body;
    
    if (!sectionName || orderNo === undefined) {
      return res.status(400).json({ success: false, message: 'Section Name and Order No. are required' });
    }

    const newSection = await Section.create({
      sectionName,
      orderNo
    });

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: newSection
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all sections
// @route   GET /api/sections
exports.getAllSections = async (req, res) => {
  try {
    const sections = await Section.find().sort({ orderNo: 1 });
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get section by ID
// @route   GET /api/sections/:id
exports.getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    res.status(200).json({ success: true, data: section });
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update section
// @route   PUT /api/sections/:id
exports.updateSection = async (req, res) => {
  try {
    const updatedSection = await Section.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedSection) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete section
// @route   DELETE /api/sections/:id
exports.deleteSection = async (req, res) => {
  try {
    const section = await Section.findByIdAndDelete(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    res.status(200).json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
