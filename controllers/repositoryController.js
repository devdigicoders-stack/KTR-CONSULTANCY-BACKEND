const RepositoryItem = require('../models/RepositoryItem');
const RepositoryFolder = require('../models/RepositoryFolder');
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

    // 1. Get distinct folders from uploaded items
    const itemFolders = await RepositoryItem.distinct('folderName', query);
    
    // 2. Get explicitly created folders from RepositoryFolder collection
    const createdFolders = await RepositoryFolder.find(query).distinct('folderName');

    // 3. Default system folders if empty
    const defaultCommonFolders = ['Loan Application Forms', 'Bank Verification Kits', 'Income & Legal Formats', 'General'];
    const defaultPrivateFolders = ['General Forms', 'My Drafts', 'Client Dossiers'];
    const baseDefaults = scope === 'common' ? defaultCommonFolders : defaultPrivateFolders;

    const folderList = Array.from(new Set([...baseDefaults, ...createdFolders, ...itemFolders]));

    res.json({ success: true, folders: folderList });
  } catch (error) {
    console.error('Get Folders Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create new custom folder in repository
// @route   POST /api/repository/folders
// @access  Private (Staff/Admin)
exports.createFolder = async (req, res) => {
  try {
    const { folderName, scope = 'common', description = '' } = req.body;
    if (!folderName || !folderName.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required.' });
    }

    const cleanName = folderName.trim();

    // Check if folder already exists in DB
    const query = { folderName: cleanName, scope };
    if (scope === 'private') {
      query.createdBy = req.adminId;
    }

    let folder = await RepositoryFolder.findOne(query);
    if (!folder) {
      folder = await RepositoryFolder.create({
        folderName: cleanName,
        scope,
        createdBy: req.adminId,
        createdByName: req.user?.name || 'Staff',
        description: description.trim()
      });
    }

    res.status(201).json({
      success: true,
      message: `Folder "${cleanName}" created successfully`,
      data: folder
    });
  } catch (error) {
    console.error('Create Folder Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Rename custom repository folder
// @route   PUT /api/repository/folders/rename
// @access  Private (Staff/Admin)
exports.renameFolder = async (req, res) => {
  try {
    const { oldName, newName, scope = 'common' } = req.body;
    if (!oldName || !newName || !newName.trim()) {
      return res.status(400).json({ success: false, message: 'Old and new folder names are required.' });
    }

    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();

    const query = { folderName: cleanOld, scope };
    if (scope === 'private' && req.user?.role !== 'admin') {
      query.createdBy = req.adminId;
    }

    // Update RepositoryFolder
    await RepositoryFolder.updateMany(query, { $set: { folderName: cleanNew } });

    // Update all items belonging to old folder
    await RepositoryItem.updateMany(query, { $set: { folderName: cleanNew } });

    res.json({
      success: true,
      message: `Folder renamed to "${cleanNew}" successfully`
    });
  } catch (error) {
    console.error('Rename Folder Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete custom repository folder
// @route   DELETE /api/repository/folders
// @access  Private (Staff/Admin)
exports.deleteFolder = async (req, res) => {
  try {
    const { folderName, scope = 'common' } = req.body;
    if (!folderName) {
      return res.status(400).json({ success: false, message: 'Folder name is required.' });
    }

    const query = { folderName: folderName.trim(), scope };
    if (scope === 'private' && req.user?.role !== 'admin') {
      query.createdBy = req.adminId;
    }

    await RepositoryFolder.deleteMany(query);
    await RepositoryItem.deleteMany(query);

    res.json({ success: true, message: `Folder "${folderName}" and its items deleted successfully` });
  } catch (error) {
    console.error('Delete Folder Error:', error);
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

    const targetFolderName = (folderName || 'General').trim();

    // Ensure folder exists in RepositoryFolder
    try {
      const folderQuery = { folderName: targetFolderName, scope };
      if (scope === 'private') folderQuery.createdBy = req.adminId;
      const existingFolder = await RepositoryFolder.findOne(folderQuery);
      if (!existingFolder) {
        await RepositoryFolder.create({
          folderName: targetFolderName,
          scope,
          createdBy: req.adminId,
          createdByName: req.user?.name || 'Staff'
        });
      }
    } catch (e) {}

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
        folderName: targetFolderName,
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
      message: `${createdItems.length} file(s) uploaded successfully`,
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

// @desc    Bulk delete repository items
// @route   POST /api/repository/items/bulk-delete
// @access  Private (Staff/Admin)
exports.bulkDeleteItems = async (req, res) => {
  try {
    const { itemIds = [] } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No item IDs provided' });
    }

    const query = { _id: { $in: itemIds } };
    if (req.user?.role !== 'admin') {
      // Staff can delete their own private or common items
      query.$or = [{ scope: 'common' }, { createdBy: req.adminId }];
    }

    const result = await RepositoryItem.deleteMany(query);

    res.json({
      success: true,
      message: `${result.deletedCount || itemIds.length} item(s) deleted successfully`
    });
  } catch (error) {
    console.error('Bulk Delete Items Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
