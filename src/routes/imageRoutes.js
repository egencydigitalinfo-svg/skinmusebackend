import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import Image from "../models/Image.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

dotenv.config();
const router = express.Router();

// 🔹 Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 Upload new image
router.post(
  "/upload-image",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No image uploaded" });

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "images" }, // Cloudinary folder
        async (error, result) => {
          if (error) {
            console.error("Cloudinary Error:", error);
            return res.status(500).json({ message: error.message });
          }

          const image = new Image({
            title: req.body.title || "",
            imageUrl: result.secure_url,
          });

          await image.save();
          res.status(201).json({ message: "Image uploaded", image });
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ message: "Failed to upload image" });
    }
  }
);

// ✅ Get all images
router.get("/", async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update image (title or replace image)
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const image = await Image.findById(req.params.id);
      if (!image) return res.status(404).json({ message: "Image not found" });

      if (req.file) {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "images" },
          async (error, result) => {
            if (error) throw error;

            image.imageUrl = result.secure_url;
            if (req.body.title) image.title = req.body.title;

            await image.save();
            res.json({ message: "Image updated", image });
          }
        );
        uploadStream.end(req.file.buffer);
      } else {
        // Update title only
        if (req.body.title) image.title = req.body.title;
        await image.save();
        res.json({ message: "Image updated", image });
      }
    } catch (err) {
      console.error("Update Error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ✅ Delete image
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "superAdmin"),
  async (req, res) => {
    try {
      const deleted = await Image.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Image not found" });

      res.json({ message: "Image deleted" });
    } catch (err) {
      console.error("Delete Error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
