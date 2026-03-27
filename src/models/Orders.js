import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    zipCode: String,

    // 🧾 Payment Method
    method: {
      type: String,
      enum: ["cod", "jazzcash", "easypaisa"], // ✅ updated enum
      required: true,
    },

    totalPrice: { type: Number, required: true },
    items: [orderItemSchema],

    // 💸 Order Status
    status: {
      type: String,
      enum: ["pending", "awaiting_verification", "shipped", "delivered","paid"], // ✅ added awaiting_verification
      default: "pending",
    },
    
    phone: { type: String, required: true }, // 📞 Customer Phone Number
    province: { type: String, required: true }, // 🏞️ Province
    additionalNotes: { type: String, default: "" }, // 📝 Additional Notes
    // 📷 Screenshot for online payments
    paymentScreenshot: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
