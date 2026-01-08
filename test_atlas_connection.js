// Test script to verify MongoDB Atlas connection
import mongoose from "mongoose";

async function testAtlasConnection() {
  console.log("🔍 Testing MongoDB connection...");
  
  // Use the same logic as the main connection file
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auditoria";
  
  console.log(`📡 Connecting to: ${mongoUri}`);
  
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Successfully connected to MongoDB!");
    
    // Test basic operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📋 Database contains ${collections.length} collections`);
    
    // Test with a simple collection
    const stats = await db.command({ dbStats: 1 });
    console.log(`📊 Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log("✅ All connection tests passed!");
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the test
testAtlasConnection();