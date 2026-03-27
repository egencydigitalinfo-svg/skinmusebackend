import express from "express";
import {
  addBrand,
  getBrands,
  updateBrand,
  deleteBrand,
  getBrandById,
  setBrandFeatured,
  getFeaturedBrands,
} from "../controllers/brandController.js"; // make sure to export new functions
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// Public routes
router.get("/", getBrands);
router.get("/:id", getBrandById);
router.get("/featured/all", getFeaturedBrands); // ✅ Fetch featured brands for slider

// Admin routes
router.post(
  "/",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "featuredImage", maxCount: 1 }
  ]),
  addBrand
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "featuredImage", maxCount: 1 }
  ]),
  updateBrand
);


router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "superAdmin"),
  deleteBrand
);

// Featured management route
router.post(
  "/featured",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.single("featuredImage"),
  setBrandFeatured
);

export default router;
