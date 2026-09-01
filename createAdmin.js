require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  const existing = await Admin.findOne({ email: 'admin@ktrconsultants.com' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);

  const admin = await Admin.create({
    name: 'Super Admin',
    email: 'admin@ktrconsultants.com',
    phone: '9999999999',
    password: hashedPassword,
    role: 'admin',
    status: 'active'
  });

  console.log('Admin created successfully!');
  console.log('Email:', admin.email);
  console.log('Password: 123456');
  console.log('Role:', admin.role);
  process.exit(0);
}

createAdmin().catch(err => { console.error(err); process.exit(1); });
