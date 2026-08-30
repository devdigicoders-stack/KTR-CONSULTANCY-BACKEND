const FinancialYear = require('../models/FinancialYear');

// @desc    Create a new financial year
// @route   POST /api/financial-years
exports.createFinancialYear = async (req, res) => {
  try {
    const { year, isActive, description } = req.body;
    
    if (!year) {
      return res.status(400).json({ success: false, message: 'Year is required' });
    }

    const newYear = await FinancialYear.create({
      year,
      isActive,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Financial Year created successfully',
      data: newYear
    });
  } catch (error) {
    console.error('Error creating financial year:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Financial Year already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all financial years
// @route   GET /api/financial-years
exports.getAllFinancialYears = async (req, res) => {
  try {
    const years = await FinancialYear.find().sort({ year: -1 });
    res.status(200).json({ success: true, data: years });
  } catch (error) {
    console.error('Error fetching financial years:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update financial year
// @route   PUT /api/financial-years/:id
exports.updateFinancialYear = async (req, res) => {
  try {
    const { year, isActive, description } = req.body;
    const updatedYear = await FinancialYear.findByIdAndUpdate(
      req.params.id,
      { year, isActive, description },
      { new: true, runValidators: true }
    );

    if (!updatedYear) {
      return res.status(404).json({ success: false, message: 'Financial Year not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Financial Year updated successfully',
      data: updatedYear
    });
  } catch (error) {
    console.error('Error updating financial year:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete financial year
// @route   DELETE /api/financial-years/:id
exports.deleteFinancialYear = async (req, res) => {
  try {
    const year = await FinancialYear.findByIdAndDelete(req.params.id);
    if (!year) {
      return res.status(404).json({ success: false, message: 'Financial Year not found' });
    }
    res.status(200).json({ success: true, message: 'Financial Year deleted successfully' });
  } catch (error) {
    console.error('Error deleting financial year:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
