const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const admin = await Admin.findById(decoded.id).select('status');
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      
      if (admin.status === 'inactive') {
        return res.status(403).json({ success: false, message: 'Not authorized, account is inactive' });
      }

      req.adminId = decoded.id; // Append admin ID to request object
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
