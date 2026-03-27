import express from "express";
import multer from "multer";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controllers/blogController.js";
import { authorizeRoles, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // ✅ in-memory for cloudinary

router.post("/", protect, authorizeRoles("admin", "superAdmin"), upload.single("image"), createBlog);
router.get("/", getBlogs);
router.get("/:id", getBlogById);
router.put("/:id", protect, authorizeRoles("admin", "superAdmin"),  upload.single("image"), updateBlog);
router.delete("/:id", protect, authorizeRoles("admin", "superAdmin"),  deleteBlog);

export default router;
