import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import HeroBanner from "../models/HeroBanners.js";
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
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "hero_banners" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary Error:", error);
          return res.status(500).json({ message: error.message });
        }

        const banner = new HeroBanner({
          image: result.secure_url,
          title: req.body.title,
          subtitle: req.body.subtitle,
          link: req.body.link,
          buttonText: req.body.buttonText || "Shop Now",
          order: req.body.order || 0,
        });

        await banner.save();
        res.status(201).json({ message: "Hero banner created", banner });
      }
    );

    // ✅ This works with memoryStorage
    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error("Hero Banner Upload Error:", err);
    res.status(500).json({ message: err.message });
  }
});


// ✅ Get all hero banners
router.get("/", async (req, res) => {
  try {
    const banners = await HeroBanner.find();
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", protect, authorizeRoles('admin', 'superAdmin'), upload.single("image"), async (req, res) => {
  try {
    const banner = await HeroBanner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    let imageUrl = banner.image;

    if (req.file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "hero_banners" },
        async (error, result) => {
          if (error) throw error;
          imageUrl = result.secure_url;

          banner.image = imageUrl;
          banner.title = req.body.title || banner.title;
          banner.subtitle = req.body.subtitle || banner.subtitle;
          banner.link = req.body.link || banner.link;
          banner.buttonText = req.body.buttonText || banner.buttonText;
          banner.order = req.body.order || banner.order;

          await banner.save();
          res.json({ message: "Banner updated", banner });
        }
      );

      uploadStream.end(req.file.buffer);
    } else {
      // no new image, just update text
      banner.title = req.body.title || banner.title;
      banner.subtitle = req.body.subtitle || banner.subtitle;
      banner.link = req.body.link || banner.link;
      banner.buttonText = req.body.buttonText || banner.buttonText;
      banner.order = req.body.order || banner.order;
      await banner.save();
      res.json({ message: "Banner updated", banner });
    }
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete hero banner
router.delete("/:id",protect, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const deleted = await HeroBanner.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Banner not found" });
    res.json({ message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
