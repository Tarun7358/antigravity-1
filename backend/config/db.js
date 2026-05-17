const mongoose = require('mongoose');

const connectDB = async ({ required = false } = {}) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/antigravity');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    const message = `MongoDB connection failed: ${error.message}`;
    if (required) {
      console.error(message);
      process.exit(1);
    }
    console.warn(message);
    return null;
  }
};

module.exports = connectDB;
