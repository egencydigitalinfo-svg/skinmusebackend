import express from "express";
import PromoCode from "../models/PromoCode.js";

const router = express.Router();

// ✅ Create promo code
router.post("/", async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);
    res.status(201).json(promo);
  } catch (error) {
    res.status(400).json({ message: "Failed to create promo code" });
  }
});

// ✅ Get all promo codes
router.get("/", async (req, res) => {
  try {
    const promos = await PromoCode.find();
    res.json(promos);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch promo codes" });
  }
});

// ✅ Verify a promo code
router.get("/verify/:code", async (req, res) => {
  try {
    const promo = await PromoCode.findOne({ code: req.params.code });
    if (!promo) return res.status(404).json({ message: "Promo code not found" });
    if (!promo.isActive) return res.status(400).json({ message: "Promo code is inactive" });
    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: "Failed to verify promo code" });
  }
});

// ✅ Update promo code
router.put("/:id", async (req, res) => {
  try {
    const updated = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Promo not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Failed to update promo code" });
  }
});

// ✅ Delete promo code
router.delete("/:id", async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ message: "Promo code deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete promo code" });
  }
});

export default router;
