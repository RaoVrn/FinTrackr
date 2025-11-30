import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "expenses_manager",
    });

    isConnected = conn.connections[0].readyState;
    console.log("MongoDB Connected");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
}
