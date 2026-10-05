const RepositoryItem = require('../models/RepositoryItem');
const fs = require('fs');
const path = require('path');

// @desc    Get repository folders (common or private)
// @route   GET /api/repository/folders
// @access  Private (Staff/Admin)
exports.getFolders = async (req, res) => {
  try {
    const { scope = 'common' } = req.query;
    const query = { scope };

    if (scope === 'private') {
      if (req.user?.role !== 'admin') {
        query.createdBy = req.adminId;
      } else if (req.query.staffId) {
        query.createdBy = req.query.staffId;
      }
    }

    const folders = await RepositoryItem.distinct('folderName', query);
    
    // Default system folders if empty
    const defaultCommonFolders = ['Loan Application Forms', 'Bank Verification Kits', 'Income & Legal Formats', 'General'];
    const folderList = Array.from(new Set([...(scope === 'common' ? defaultCommonFolders : ['General Forms', 'My Drafts']), ...folders]));

    res.json({ success: true, folders: folderList });
  } catch (error) {
    console.error('Get Folders Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get repository items
// @route   GET /api/repository/items
// @access  Private (Staff/Admin)
exports.getItems = async (req, res) => {
  try {
    const { scope = 'common', folderName } = req.query;
    const query = { scope };

    if (folderName && folderName !== 'All') {
      query.folderName = folderName;
    }

    if (scope === 'private') {
      if (req.user?.role !== 'admin') {
        query.createdBy = req.adminId;
      } else if (req.query.staffId) {
        query.createdBy = req.query.staffId;
      }
    }

    const items = await RepositoryItem.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, items });
  } catch (error) {
    console.error('Get Items Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Upload new files to repository
// @route   POST /api/repository/upload
// @access  Private (Staff/Admin)
exports.uploadItem = async (req, res) => {
  try {
    const { scope = 'common', folderName = 'General', name, notes } = req.body;

    if (!req.file && !req.files) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    const createdItems = [];

    for (const f of files) {
      if (!f) continue;
      const fileUrl = `/uploads/${f.filename}`;
      const ext = path.extname(f.originalname).toLowerCase().replace('.', '');
      let fileType = 'document';
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) fileType = 'image';
      else if (['pdf'].includes(ext)) fileType = 'pdf';
      else if (['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'spreadsheet';

      const item = await RepositoryItem.create({
        scope,
        folderName: folderName.trim() || 'General',
        name: name ? name.trim() : f.originalname.replace(/\.[^/.]+$/, ''),
        fileUrl,
        fileType,
        fileSize: f.size || 0,
        notes: notes ? notes.trim() : '',
        createdBy: req.adminId,
        createdByName: req.user?.name || 'Staff'
      });
      createdItems.push(item);
    }

    res.status(201).json({
      success: true,
      message: 'Files uploaded successfully',
      data: createdItems
    });
  } catch (error) {
    console.error('Upload Repository Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update repository item (rename, notes, move folder)
// @route   PATCH /api/repository/items/:id
// @access  Private (Staff/Admin)
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, notes, folderName } = req.body;

    const item = await RepositoryItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.scope === 'private' && req.user?.role !== 'admin' && item.createdBy.toString() !== req.adminId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (name) item.name = name.trim();
    if (notes !== undefined) item.notes = notes.trim();
    if (folderName) item.folderName = folderName.trim();

    await item.save();

    res.json({ success: true, message: 'Item updated successfully', data: item });
  } catch (error) {
    console.error('Update Item Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete repository item
// @route   DELETE /api/repository/items/:id
// @access  Private (Staff/Admin)
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await RepositoryItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.scope === 'private' && req.user?.role !== 'admin' && item.createdBy.toString() !== req.adminId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await RepositoryItem.findByIdAndDelete(id);

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete Item Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
