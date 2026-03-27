import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: String,
    content: { type: String, required: true },
    author: String,
    category: { type: [String], default: [] }, // ✅ multiple categories
    image: String, // ✅ cloudinary image url
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);
