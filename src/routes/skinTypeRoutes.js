import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import SkinType from "../models/SkinTypes.js";
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
      { folder: "SkinTypes" },
      async (error, uploadResult) => {
        if (error) return res.status(500).json({ message: error.message });

        // Save banner to DB
        const skinType = new SkinType({
          image: uploadResult.secure_url,
          title: req.body.name || "",
          skinTypes: req.body.skinType || "",
        });
        await skinType.save();

        res.status(201).json({ message: "skinType added", skinType });
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
    const skinTypes = await SkinType.find().sort({ createdAt: -1 });
    res.json(skinTypes);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", protect, authorizeRoles("admin", "superAdmin"), async (req, res) => {
  try {
    const skinType = await SkinType.findById(req.params.id);
    if (!skinType) return res.status(404).json({ message: "SkinType not found" });
    res.json(skinType);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete a banner
router.delete("/:id", protect, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    await SkinType.findByIdAndDelete(req.params.id);
    res.json({ message: "SkinType deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 UPDATE Skin Type (optional new image)
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const skinType = await SkinType.findById(req.params.id);
      if (!skinType) {
        return res.status(404).json({ message: "Skin type not found" });
      }

      // If new image uploaded — upload to Cloudinary
      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "SkinTypes" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        skinType.image = uploadResult.secure_url;
      }

      // Update other fields
      if (req.body.name) skinType.name = req.body.name;
      if (req.body.description) skinType.description = req.body.description;

      await skinType.save();

      res.json({
        message: "Skin type updated successfully",
        skinType,
      });
    } catch (err) {
      console.error("❌ Update Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
