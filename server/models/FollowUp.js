// server/models/FollowUp.js
import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema({
  relatedType: { type: String, enum: ["Lead", "Quotation"], required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: true }, // references Lead or Quotation
  followUpDate: { type: Date, required: true },
  notes: { type: String },
  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("FollowUp", followUpSchema);
