// middleware/upload.js
import multer from "multer";

// Store files in memory (buffer), no local folder needed
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // optional: 5MB per file
});

export default upload;
