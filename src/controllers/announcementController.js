import Announcement from "../models/AnnouncementBar.js";

// ✅ Create new announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { message, backgroundColor, textColor, isActive, order } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const newAnnouncement = await Announcement.create({
      message,
      backgroundColor,
      textColor,
      isActive,
      order,
    });

    res.status(201).json({ message: "Announcement created", announcement: newAnnouncement });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all announcements
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ order: 1, createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update announcement
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // 🧠 Convert isActive to a real boolean if present
    if (req.body.isActive !== undefined) {
      req.body.isActive =
        req.body.isActive === true || req.body.isActive === "true";
    }

    const updated = await Announcement.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated)
      return res.status(404).json({ message: "Announcement not found" });

    res.json({ message: "Announcement updated", announcement: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: "Announcement not found" });

    res.json({ message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
