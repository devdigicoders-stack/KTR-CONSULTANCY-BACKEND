require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const admins = await Admin.find({});
    console.log('Admins in DB:');
    if (admins.length === 0) {
      console.log('No admins found.');
    } else {
      admins.forEach(a => {
        console.log(`- Email: ${a.email}, Role: ${a.role}, Status: ${a.status}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

checkAdmins();
