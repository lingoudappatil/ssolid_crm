// server/routes/settingsRoutes.js
import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Schema for dropdown values (Lead Source, Order Status, etc.)
const settingSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  values: { type: [String], default: [] },
});

const Setting = mongoose.model("Setting", settingSchema);

// ✅ GET — Fetch a setting (e.g., /api/settings/lead_sources)
router.get("/:type", async (req, res) => {
  try {
    const setting = await Setting.findOne({ type: req.params.type });
    if (!setting) {
      return res.status(200).json({ type: req.params.type, values: [] });
    }
    res.json(setting);
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

// ✅ POST — Create or update a setting
router.post("/:type", async (req, res) => {
  try {
    const { values } = req.body;
    if (!Array.isArray(values)) {
      return res.status(400).json({ error: "Values must be an array" });
    }

    const updated = await Setting.findOneAndUpdate(
      { type: req.params.type },
      { values },
      { upsert: true, new: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

export default router;
