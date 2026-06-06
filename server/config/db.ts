import mongoose from 'mongoose';

const connectDB = async () => {
  const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/corebiz';

  if (!process.env.MONGO_URI) {
    console.warn('[DB] WARNING: MONGO_URI not set in environment. Falling back to localhost.');
  }

  try {
    console.log(`[DB] Connecting to MongoDB...`);
    await mongoose.connect(connStr);
    console.log(`[DB] ✅ MongoDB Connected successfully to: ${mongoose.connection.host}`);
  } catch (error: any) {
    console.error(`[DB] ❌ MongoDB connection FAILED: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
