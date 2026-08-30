const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper for logging admin activity
const logAdminActivity = async (adminId, action, details, req) => {
  try {
    const admin = await Admin.findById(adminId);
    if (admin) {
      admin.activityLogs.push({
        action,
        details,
        ipAddress: req.ip || req.connection.remoteAddress
      });
      // Keep only last 50 logs to prevent unbounded array growth
      if (admin.activityLogs.length > 50) {
        admin.activityLogs.shift();
      }
      await admin.save();
    }
  } catch (err) {
    console.error('Error logging admin activity:', err);
  }
};

// @desc    Register new admin
// @route   POST /api/admin/register
// @access  Public (Can be restricted later)
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    // Check if admin exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    if (admin) {
      res.status(201).json({
        success: true,
        data: {
          _id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          token: generateToken(admin._id),
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid admin data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Authenticate an admin
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for admin email
    const admin = await Admin.findOne({ email });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      if (admin.status === 'inactive') {
        return res.status(403).json({ success: false, message: 'Account is inactive. Please contact admin.' });
      }

      await logAdminActivity(admin._id, 'Login', 'Admin logged in successfully', req);

      res.json({
        success: true,
        data: {
          _id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          status: admin.status,
          notificationSettings: admin.notificationSettings,
          securitySettings: admin.securitySettings,
          token: generateToken(admin._id),
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (admin) {
      res.json({ success: true, data: admin });
    } else {
      res.status(404).json({ success: false, message: 'Admin not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private
exports.updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);

    if (admin) {
      admin.name = req.body.name || admin.name;
      admin.email = req.body.email || admin.email;
      admin.phone = req.body.phone || admin.phone;

      if (req.body.notificationSettings) {
        admin.notificationSettings = { ...admin.notificationSettings, ...req.body.notificationSettings };
      }
      if (req.body.securitySettings) {
        admin.securitySettings = { ...admin.securitySettings, ...req.body.securitySettings };
      }

      const updatedAdmin = await admin.save();
      
      await logAdminActivity(admin._id, 'Profile Update', 'Admin updated profile information', req);

      res.json({
        success: true,
        data: {
          _id: updatedAdmin.id,
          name: updatedAdmin.name,
          email: updatedAdmin.email,
          phone: updatedAdmin.phone,
          role: updatedAdmin.role,
          notificationSettings: updatedAdmin.notificationSettings,
          securitySettings: updatedAdmin.securitySettings,
          token: generateToken(updatedAdmin._id),
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'Admin not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Change password
// @route   PUT /api/admin/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    
    if (admin) {
      const { currentPassword, newPassword } = req.body;
      
      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid current password' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
      
      await admin.save();
      
      await logAdminActivity(admin._id, 'Password Change', 'Admin changed their password', req);

      res.json({ success: true, message: 'Password updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Admin not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users (Admins & Users)
// @route   GET /api/admin/users
// @access  Private (Admin Only)
exports.getUsers = async (req, res) => {
  try {
    const requester = await Admin.findById(req.adminId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }
    
    // Fetch all users except the requester themselves if you want, but getting all is fine
    const users = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new user/admin
// @route   POST /api/admin/users
// @access  Private (Admin Only)
exports.createUser = async (req, res) => {
  try {
    const requester = await Admin.findById(req.adminId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }

    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please add all required fields' });
    }

    const userExists = await Admin.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await Admin.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'staff',
    });

    if (newUser) {
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          _id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin Only)
exports.getUserById = async (req, res) => {
  try {
    const requester = await Admin.findById(req.adminId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }

    const user = await Admin.findById(req.params.id).select('-password');
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin Only)
exports.updateUser = async (req, res) => {
  try {
    const requester = await Admin.findById(req.adminId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }

    const user = await Admin.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.role = req.body.role || user.role;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          _id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          status: updatedUser.status
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin Only)
exports.deleteUser = async (req, res) => {
  try {
    const requester = await Admin.findById(req.adminId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }

    // Prevent deleting oneself
    if (req.params.id === req.adminId) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }

    const user = await Admin.findByIdAndDelete(req.params.id);
    
    if (user) {
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Toggle user status (Active/Inactive)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin Only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const requester = await Admin.findById(req.adminId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }

    if (req.params.id === req.adminId) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate yourself' });
    }

    const user = await Admin.findById(req.params.id);
    
    if (user) {
      user.status = user.status === 'active' ? 'inactive' : 'active';
      await user.save();

      res.json({ success: true, message: `User status changed to ${user.status}`, data: { status: user.status } });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
