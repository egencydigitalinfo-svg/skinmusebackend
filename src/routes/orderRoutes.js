import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { authorizeRoles, protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/", upload.single("paymentScreenshot"), createOrder);
router.get("/", protect, authorizeRoles("admin", "superAdmin"), getAllOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id", protect, authorizeRoles("admin", "superAdmin"), updateOrderStatus);
router.delete("/:id", protect, authorizeRoles("admin", "superAdmin"), deleteOrder);

export default router;
