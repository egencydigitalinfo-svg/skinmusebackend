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
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true, // ✅ indexing for fast search
    },

    // 🔥 Parent Category (for subcategories)
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔥 COMPOUND UNIQUE INDEX (BEST)
categorySchema.index({ slug: 1, parent_id: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);