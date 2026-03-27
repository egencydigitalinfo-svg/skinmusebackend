import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  title: { type: String, required: false }, // optional
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Image", ImageSchema);
