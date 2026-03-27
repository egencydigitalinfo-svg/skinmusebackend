import mongoose from "mongoose";

const category = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true, // Cloudinary image URL
    },
    title: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    }, 
  },
  { timestamps: true }
);

export default mongoose.model("Category", category);
