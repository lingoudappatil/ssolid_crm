import express from "express";

import {
  getAllFollowUps,
  createFollowUp,
} from "../controllers/followUpController.js";

const router = express.Router();

// Get all follow-ups
router.get("/", getAllFollowUps);

// Add a new follow-up
router.post("/", createFollowUp);

export default router;