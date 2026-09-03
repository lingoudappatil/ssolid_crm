  // server/models/Leads.js
  import mongoose from "mongoose";

  // Define Follow-Up Schema with date + time
  const FollowUpSchema = new mongoose.Schema({
    date: {
      type: String,
      required: [true, "Follow-up date is required"],
    },
    time: {
      type: String,
      required: [true, "Follow-up time is required"],
    },
    remark: {
      type: String,
      required: [true, "Remark is required"],
    },
  });

  // Define Lead Schema
  const leadSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Name is required"] },
    email: { type: String, required: [true, "Email is required"] },
    phone: { type: String, required: [true, "Phone is required"] },
    address: { type: String, required: [true, "Address is required"] },
    state: { type: String, required: [true, "State is required"] },
    followUps: [FollowUpSchema],
    createdAt: { type: Date, default: Date.now },
  });

  // Export
  export default mongoose.model("Lead", leadSchema);
