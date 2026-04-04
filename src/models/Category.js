import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      unique: true,
    },

    // 🔥 IMPORTANT: Parent Category Reference
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // null = main category
    },

    status: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);