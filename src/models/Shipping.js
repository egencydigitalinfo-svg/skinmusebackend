import mongoose from "mongoose";

const shippingSchema = new mongoose.Schema({
  shippingPrice: { type: Number, required: true },  // fixed shipping fee
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Shipping", shippingSchema);
