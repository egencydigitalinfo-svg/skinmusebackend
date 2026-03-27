import mongoose from "mongoose";

const skinType = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true, // Cloudinary image URL
    },
    title: {
      type: String,
      default: "",
    },
    skinTypes: {
      type: String,
      default: "",
    }, 
  },
  { timestamps: true }
);

export default mongoose.model("SkinType", skinType);
