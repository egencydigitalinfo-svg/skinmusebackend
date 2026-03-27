import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    backgroundColor: {
      type: String,
      default: "#F97316", // default orange (Tailwind's secondary)
    },
    textColor: {
      type: String,
      default: "#FFFFFF", // white text
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0, // to control display order if needed
    },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
