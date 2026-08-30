const express = require('express');
const router = express.Router();
const { 
  registerAdmin, 
  loginAdmin, 
  getAdminProfile, 
  updateAdminProfile, 
  changePassword,
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', protect, registerAdmin);
router.post('/login', loginAdmin);
router.route('/profile')
  .get(protect, getAdminProfile)
  .put(protect, updateAdminProfile);
router.put('/change-password', protect, changePassword);

// User Management Routes
router.route('/users')
  .get(protect, getUsers)
  .post(protect, createUser);

router.route('/users/:id')
  .get(protect, getUserById)
  .put(protect, updateUser)
  .delete(protect, deleteUser);

router.patch('/users/:id/status', protect, toggleUserStatus);

module.exports = router;
