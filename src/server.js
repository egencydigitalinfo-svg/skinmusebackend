// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import brandRoutes from './routes/brandRoutes.js';
import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js'
import skinTypeRoutes from './routes/skinTypeRoutes.js'
import announcementRoutes from './routes/announcementRoutes.js';
import heroBannerRoutes from './routes/heroBannerRoutes.js';
import minOrderRoutes from './routes/minOrderRoutes.js';
import promoCodeRoutes from './routes/promoCodeRoutes.js'
import blogRoutes from './routes/blogRoutes.js';
import emailRoute from './routes/emailRoute.js'
import shippingRoutes from "./routes/shippingRoutes.js";
import imageRoutes from "./routes/imageRoutes.js"
const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/skinType', skinTypeRoutes);
app.use('/api/hero-banners', heroBannerRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/minorder', minOrderRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/promocodes', promoCodeRoutes);
app.use('/api/images', imageRoutes);
app.use('/api', emailRoute);

// Error handler
app.use(errorHandler);

// Local run only
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running locally on port ${PORT}`));
}

// 👉 Export default for Vercel
export default app;
