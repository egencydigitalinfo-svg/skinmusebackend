import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Category from "../models/Category.js";
import dotenv from "dotenv";
import upload from "../middlewares/upload.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

dotenv.config();
const router = express.Router();




// 🔹 Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/", protect, authorizeRoles('admin', 'superAdmin'), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const stream = cloudinary.uploader.upload_stream(
      { folder: "Category" },
      async (error, uploadResult) => {
        if (error) return res.status(500).json({ message: error.message });

        // Save banner to DB
        const category = new Category({
          image: uploadResult.secure_url,
          title: req.body.name || "",
          category: req.body.category || "",
        });
        await category.save();

        res.status(201).json({ message: "Category added", category });
      }
    );

    // ✅ Pipe image buffer into the stream
    stream.end(req.file.buffer);
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get all banners
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// 🔹 GET single category by ID
router.get("/:id", protect, authorizeRoles("admin", "superAdmin"), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Delete a banner
router.delete("/:id", protect, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Edit / Update a category
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) return res.status(404).json({ message: "Category not found" });

      // If a new image is uploaded
      if (req.file) {
        // Delete old image from Cloudinary if exists
        if (category.cloudinary_id) {
          await cloudinary.uploader.destroy(category.cloudinary_id);
        }

        // Upload new image
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "Category" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        category.image = uploadResult.secure_url;
        category.cloudinary_id = uploadResult.public_id;
      }

      // Update text fields
      if (req.body.name) category.title = req.body.name;
      if (req.body.category) category.category = req.body.category;

      const updatedCategory = await category.save();
      res.json({ message: "Category updated successfully", category: updatedCategory });
    } catch (err) {
      console.error("❌ Update Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
export default router;
