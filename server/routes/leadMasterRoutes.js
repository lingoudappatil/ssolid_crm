import express from "express";

import {
  getStatuses,
  getSources,
  getLostReasons
} from "../controllers/leadMasterController.js";

const router = express.Router();

router.get("/statuses", getStatuses);
router.get("/sources", getSources);
router.get("/lost-reasons", getLostReasons);

export default router;