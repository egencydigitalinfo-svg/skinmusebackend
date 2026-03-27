// models/Product.js
import mongoose from "mongoose";

const LitreSchema = new mongoose.Schema({
  amount: { type: String, required: true }, // e.g., "0.5", "1"
  stock: { type: Number, default: 0 },
  price: { type: Number},
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number},
    description: String,
    category: String,
    productType: {
      type: String,
      enum: ["makeup", "skincare", "haircare", "bath&body", "other"],
      default: "other",
    },
    images: [{ type: String }],
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    stock: { type: Number, default: 1 },
    salesCount: { type: Number, default: 0 },
    skinType: [{ type: String, enum: ["dry", "oily", "combination", "acne"] }],
    ingredients: [{ type: String }],
    litres: [LitreSchema], // for products sold in different litre sizes
    colors: [
      {
        name: { type: String, required: true }, // e.g. "Red"
        hex: { type: String },                  // optional hex code
        stock: { type: Number, default: 1 },   // stock per color
        price:{type:Number}
      },
    ],
     reviews: [
  {
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],    

    // 🆕 Added fields
    isTrending: { type: Boolean, default: false },
    isHotSale: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);


export default mongoose.model("Product", productSchema);
