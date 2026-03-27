import Shipping from "../models/Shipping.js";

export const getShipping = async (req, res) => {
  try {
    const data = await Shipping.findOne();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load shipping settings" });
  }
};

export const createShipping = async (req, res) => {
  try {
    const data = await Shipping.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: "Failed to create shipping" });
  }
};

export const updateShipping = async (req, res) => {
  try {
    const updated = await Shipping.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update shipping" });
  }
};

export const deleteShipping = async (req, res) => {
  try {
    await Shipping.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Shipping deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Failed to delete shipping" });
  }
};