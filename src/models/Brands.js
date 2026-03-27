import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ["makeup", "skincare", "haircare", "bath&body"],
    required: true,
  },
  description: String,
  logo: String,
  discount: { type: Number, required: false },
  isFeatured: { type: Boolean, default: false }, // Admin can mark featured
  featuredImage: String,
});

export default mongoose.model("Brand", brandSchema);
