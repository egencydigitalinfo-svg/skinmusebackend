import mongoose from "mongoose";

const heroBannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true, // Cloudinary URL
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      default: "Shop Now",
    },
  },
  { timestamps: true }
);

export default mongoose.model("HeroBanner", heroBannerSchema);
