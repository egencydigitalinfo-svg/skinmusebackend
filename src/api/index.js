import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import connectDB from "../config/db.js";

import brandRoutes from "../routes/brandRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import uploadRoutes from "../routes/uploadRoutes.js";
import orderRoutes from "../routes/orderRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import bannerRoutes from "../routes/bannerRoutes.js";
import heroBannerRoutes from "../routes/heroBannerRoutes.js";
import blogRoutes from "../routes/blogRoutes.js";

connectDB();

const app = express();

// Middleware
app.use(cors({ origin: "*" })); // Adjust origin for production
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/hero-banners", heroBannerRoutes);
app.use("/api/blogs", blogRoutes);

// Root test route
app.get("/", (req, res) => res.send("Beauty Store API is running!"));

// Local run only
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running locally on port ${PORT}`));
}

// 👉 Export default for Vercel
export default app;