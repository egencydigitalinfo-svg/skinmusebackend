// routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  editUsers,
  getAllUsers,
  deleteUser,
} from "../controllers/authController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public
router.post("/register", register);
router.post("/login", login);

// Admin & SuperAdmin can view users, but controller logic will filter accordingly
router.get("/users", protect, authorizeRoles("admin", "superAdmin"), getAllUsers);

// routes/authRoutes.js
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

// Only SuperAdmin can edit & delete
router.put("/editUser/:id", protect, authorizeRoles("superAdmin"), editUsers);
router.delete("/user/:id", protect, authorizeRoles("superAdmin"), deleteUser);


export default router;
