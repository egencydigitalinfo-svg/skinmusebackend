import express from "express";
import MinOrder from "../models/MinOrderSetting.js";

const router = express.Router();

// ✅ Create or update min order price
router.post("/", async (req, res) => {
  try {
    const { price } = req.body;
    let minOrder = await MinOrder.findOne();
    if (minOrder) {
      minOrder.price = price;
      await minOrder.save();
      return res.json(minOrder);
    } else {
      minOrder = await MinOrder.create({ price });
      return res.status(201).json(minOrder);
    }
  } catch (error) {
    res.status(400).json({ message: "Failed to save minimum order" });
  }
});

// ✅ Get min order
router.get("/", async (req, res) => {
  try {
    const minOrder = await MinOrder.find();
    res.json(minOrder);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch minimum order" });
  }
});

// ✅ Update min order directly
router.put("/:id", async (req, res) => {
  try {
    const updated = await MinOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Failed to update min order" });
  }
});

// ✅ Delete min order
router.delete("/:id", async (req, res) => {
  try {
    await MinOrder.findByIdAndDelete(req.params.id);
    res.json({ message: "Min order deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete min order" });
  }
});

export default router;
