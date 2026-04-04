import express from "express";
import {
  getProducts,
  addProduct,
  getProductById,
  getHighlights,
  updateProduct,
  deleteProduct,
  reviewOrder,
  deleteReview,
  getShopData,
} from "../controllers/productController.js";

import upload from "../middlewares/upload.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/shop", getShopData);

router.get("/", getProducts);

// ⭐ reviews must come BEFORE /:id routes
router.post(
  "/reviews",
  protect,
  authorizeRoles("admin", "superAdmin"),
  reviewOrder
);

router.delete(
  "/reviews/:productId/:reviewId",
  protect,
  authorizeRoles("admin", "superAdmin"),
  deleteReview
);

router.get("/highlights", getHighlights);

router.post(
  "/",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.array("images"),
  addProduct
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "superAdmin"),
  upload.array("images"),
  updateProduct
);

router.get("/:id", getProductById);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "superAdmin"),
  deleteProduct
);

export default router;
