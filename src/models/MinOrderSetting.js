import mongoose from "mongoose";

const minOrderSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("MinOrder", minOrderSchema);
