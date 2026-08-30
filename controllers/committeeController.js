const Committee = require('../models/Committee');

// @desc    Create a new committee member
// @route   POST /api/committees
exports.createCommittee = async (req, res) => {
  try {
    const { committeeType, designation, roleType, memberName } = req.body;
    
    if (!committeeType || !designation || !roleType || !memberName) {
      return res.status(400).json({ success: false, message: 'Committee Type, Designation, Role Type, and Member Name are required' });
    }

    const newCommittee = await Committee.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Committee member created successfully',
      data: newCommittee
    });
  } catch (error) {
    console.error('Error creating committee member:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all committee members
// @route   GET /api/committees
exports.getAllCommittees = async (req, res) => {
  try {
    const committees = await Committee.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: committees });
  } catch (error) {
    console.error('Error fetching committee members:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get committee member by ID
// @route   GET /api/committees/:id
exports.getCommitteeById = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee member not found' });
    }
    res.status(200).json({ success: true, data: committee });
  } catch (error) {
    console.error('Error fetching committee member:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update committee member
// @route   PUT /api/committees/:id
exports.updateCommittee = async (req, res) => {
  try {
    const updatedCommittee = await Committee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCommittee) {
      return res.status(404).json({ success: false, message: 'Committee member not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Committee member updated successfully',
      data: updatedCommittee
    });
  } catch (error) {
    console.error('Error updating committee member:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete committee member
// @route   DELETE /api/committees/:id
exports.deleteCommittee = async (req, res) => {
  try {
    const committee = await Committee.findByIdAndDelete(req.params.id);
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee member not found' });
    }
    res.status(200).json({ success: true, message: 'Committee member deleted successfully' });
  } catch (error) {
    console.error('Error deleting committee member:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
