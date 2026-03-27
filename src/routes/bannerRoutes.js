import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Banner from "../models/Banners.js";
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

router.post("/upload", protect, authorizeRoles('admin', 'superAdmin'), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const stream = cloudinary.uploader.upload_stream(
      { folder: "banners" },
      async (error, uploadResult) => {
        if (error) return res.status(500).json({ message: error.message });

        // Save banner to DB
        const banner = new Banner({
          image: uploadResult.secure_url,
          title: req.body.title || "",
          link: req.body.link || "",
        });
        await banner.save();

        res.status(201).json({ message: "Banner uploaded", banner });
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
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Edit/Update Banner
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) return res.status(404).json({ message: "Banner not found" });

      // If new image is uploaded
      if (req.file) {
        // Delete old image from Cloudinary (if exists)
        if (banner.cloudinary_id) {
          await cloudinary.uploader.destroy(banner.cloudinary_id);
        }

        // Upload new image
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "banners" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        // Update banner with new image info
        banner.image = uploadResult.secure_url;
        banner.cloudinary_id = uploadResult.public_id;
      }

      // Update text fields
      if (req.body.title) banner.title = req.body.title;
      if (req.body.link) banner.link = req.body.link;

      const updatedBanner = await banner.save();
      res.json({ message: "Banner updated successfully", banner: updatedBanner });
    } catch (err) {
      console.error("❌ Update Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ✅ Delete a banner
router.delete("/:id", protect, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
