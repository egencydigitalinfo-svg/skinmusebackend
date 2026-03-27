import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Create Announcement (Admin/SuperAdmin)
router.post("/", protect, authorizeRoles("admin", "superAdmin"), createAnnouncement);

// ✅ Get All Announcements (Public)
router.get("/", getAnnouncements);

// ✅ Update Announcement
router.put("/:id", protect, authorizeRoles("admin", "superAdmin"), updateAnnouncement);

// ✅ Delete Announcement
router.delete("/:id", protect, authorizeRoles("admin", "superAdmin"), deleteAnnouncement);

export default router;
