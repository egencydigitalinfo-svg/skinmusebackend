import express from "express";
// 1. Import your middleware (which uses memoryStorage)
import upload from "../middlewares/upload.js";
import cloudinary from "../config/cloudinary.js";
// 2. Remove 'multer' and 'fs'. They are not needed here.

const router = express.Router();

// 3. DELETE THIS LINE. It is the cause of the error.
// const upload = multer({ dest: 'uploads/' });

// 4. Use your imported 'upload' middleware
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // 5. Use the same upload-from-buffer logic as your product controller
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "uploads" }, // Optional: folder in Cloudinary
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer); // Upload the buffer
    }); // fs.unlinkSync(req.file.path);

    // 6. DELETE THIS LINE. There is no local file to delete.
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

export default router;
