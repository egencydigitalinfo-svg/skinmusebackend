import MinOrderSetting from "../models/MinOrderSetting.js";

// ✅ Create or Update Minimum Order (only one active record)
export const upsertMinOrder = async (req, res) => {
  try {
    const { minAmount, isActive } = req.body;

    if (!minAmount || minAmount < 0) {
      return res.status(400).json({ message: "Minimum amount must be greater than 0" });
    }

    // Find the existing active record
    let existing = await MinOrderSetting.findOne();

    if (existing) {
      existing.minAmount = minAmount;
      existing.isActive = isActive ?? existing.isActive;
      const updated = await existing.save();
      return res.status(200).json({ message: "Minimum order updated", setting: updated });
    } else {
      const newSetting = await MinOrderSetting.create({ minAmount, isActive });
      return res.status(201).json({ message: "Minimum order created", setting: newSetting });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get current Minimum Order Setting
export const getMinOrder = async (req, res) => {
  try {
    const setting = await MinOrderSetting.findOne();
    res.status(200).json(setting || { minAmount: 0, isActive: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Check if Cart Total Meets Minimum Order
export const checkMinOrder = async (req, res) => {
  try {
    const { cartTotal } = req.body;

    const setting = await MinOrderSetting.findOne({ isActive: true });

    if (!setting) {
      return res.status(200).json({ eligible: true, message: "No minimum order set" });
    }

    if (cartTotal < setting.minAmount) {
      return res.status(400).json({
        eligible: false,
        message: `Minimum order amount is Rs. ${setting.minAmount}. Please add more items to continue.`,
        requiredAmount: setting.minAmount,
      });
    }

    res.status(200).json({
      eligible: true,
      message: "Eligible for checkout",
      requiredAmount: setting.minAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Update Minimum Order
export const updateMinOrder = async (req, res) => {
  try {
    const { name, minAmount, isActive } = req.body;
    const setting = await MinOrderSetting.findById(req.params.id);

    if (!setting) return res.status(404).json({ message: "Minimum order not found" });

    setting.name = name || setting.name;
    setting.minAmount = minAmount ?? setting.minAmount;
    setting.isActive = isActive ?? setting.isActive;

    const updated = await setting.save();
    res.status(200).json({ message: "Minimum order updated successfully", updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Minimum Order
export const deleteMinOrder = async (req, res) => {
  try {
    const setting = await MinOrderSetting.findByIdAndDelete(req.params.id);
    if (!setting) return res.status(404).json({ message: "Minimum order not found" });

    res.status(200).json({ message: "Minimum order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

