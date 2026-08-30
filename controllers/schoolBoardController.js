const SchoolBoard = require('../models/SchoolBoard');

// @desc    Create a new school board
// @route   POST /api/school-boards
exports.createSchoolBoard = async (req, res) => {
  try {
    const { boardName, isDefault } = req.body;
    
    if (!boardName) {
      return res.status(400).json({ success: false, message: 'Board Name is required' });
    }

    // If setting as default, we might want to unset other defaults depending on business logic. 
    // Usually only one board is default.
    if (isDefault) {
      await SchoolBoard.updateMany({}, { isDefault: false });
    }

    const newBoard = await SchoolBoard.create({
      boardName,
      isDefault: isDefault || false
    });

    res.status(201).json({
      success: true,
      message: 'School Board created successfully',
      data: newBoard
    });
  } catch (error) {
    console.error('Error creating school board:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'School Board already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all school boards
// @route   GET /api/school-boards
exports.getAllSchoolBoards = async (req, res) => {
  try {
    const boards = await SchoolBoard.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: boards });
  } catch (error) {
    console.error('Error fetching school boards:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get school board by ID
// @route   GET /api/school-boards/:id
exports.getSchoolBoardById = async (req, res) => {
  try {
    const board = await SchoolBoard.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'School Board not found' });
    }
    res.status(200).json({ success: true, data: board });
  } catch (error) {
    console.error('Error fetching school board:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update school board
// @route   PUT /api/school-boards/:id
exports.updateSchoolBoard = async (req, res) => {
  try {
    const { boardName, isDefault } = req.body;

    if (isDefault) {
      await SchoolBoard.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
    }

    const updatedBoard = await SchoolBoard.findByIdAndUpdate(
      req.params.id,
      { boardName, isDefault },
      { new: true, runValidators: true }
    );

    if (!updatedBoard) {
      return res.status(404).json({ success: false, message: 'School Board not found' });
    }

    res.status(200).json({
      success: true,
      message: 'School Board updated successfully',
      data: updatedBoard
    });
  } catch (error) {
    console.error('Error updating school board:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'School Board name already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete school board
// @route   DELETE /api/school-boards/:id
exports.deleteSchoolBoard = async (req, res) => {
  try {
    const board = await SchoolBoard.findByIdAndDelete(req.params.id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'School Board not found' });
    }
    res.status(200).json({ success: true, message: 'School Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting school board:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
