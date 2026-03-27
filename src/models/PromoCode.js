import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model("PromoCode", promoSchema);
