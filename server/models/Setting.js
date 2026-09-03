// server/models/Setting.js
import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  type: { type: String, required: true },   // e.g. 'leadSource', 'state', etc.
  values: { type: [String], default: [] }   // All dropdown options
});

export default mongoose.model("Setting", settingSchema);