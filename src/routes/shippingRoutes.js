import express from "express";
import {
  getShipping,
  createShipping,
  updateShipping,
  deleteShipping
} from "../controllers/shippingController.js";

const router = express.Router();

router.get("/", getShipping);
router.post("/", createShipping);
router.delete("/:id", deleteShipping);
router.put("/:id", updateShipping);

export default router;
