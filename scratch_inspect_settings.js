const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Load WebsiteSetting model
const WebsiteSetting = require('./models/WebsiteSetting');

const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swadesicarts';

mongoose.connect(dbUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      console.log('No settings found!');
    } else {
      console.log('About stats:', JSON.stringify(settings.about ? settings.about.stats : null, null, 2));
      console.log('Colors:', JSON.stringify(settings.colors, null, 2));
    }
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
