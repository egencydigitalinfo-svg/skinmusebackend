import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true, // Cloudinary image URL
    },
    title: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
