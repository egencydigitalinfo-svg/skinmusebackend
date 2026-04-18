import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Products.js"; // adjust path

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://syedumerhassni:naibtana123@cluster0.8kun6ji.mongodb.net/beauty_store_testing?retryWrites=true&w=majority&appName=Cluster0";

const migrateImages = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    await Product.updateMany({ image: { $exists: true } }, [
      {
        $set: {
          images: { $concatArrays: [{ $ifNull: ["$images", []] }, ["$image"]] },
        },
      },
      { $unset: "image" },
    ]);
    console.log("All products migrated!");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrateImages();
