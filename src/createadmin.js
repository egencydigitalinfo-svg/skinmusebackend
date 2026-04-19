import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "./models/Users.js";

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'beauty_store_testing',
    })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const createSuperAdmin = async () => {
  try {
    const name = "Super Admin User";
    const email = "superadmin@skinmuse.com"; // change if needed
    const password = "superadmin123!"; // change if needed

    // Check if superAdmin already exists
    const existingSuperAdmin = await User.findOne({ email });
    if (existingSuperAdmin) {
      console.log("⚠️ SuperAdmin already exists:", existingSuperAdmin.email);
      return process.exit();
    }

    // Create superAdmin
    const superAdmin = new User({
      name,
      email,
      password,
      role: "superAdmin", // 🔑 special role
    });

    await superAdmin.save();
    console.log("✅ SuperAdmin created successfully:", superAdmin.email);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createSuperAdmin();
