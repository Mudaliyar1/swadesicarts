const mongoose = require('mongoose');
const dns = require('dns');

// Set DNS resolver to use Google DNS to fix SRV lookup issues
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    });
    
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin if none exists
    const Admin = require('../models/Admin');
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      await Admin.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@swadesicarts.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'superadmin'
      });
      console.log('✓ Default admin created');
    }
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
