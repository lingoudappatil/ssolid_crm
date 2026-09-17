import express from "express";

import {
  create,
  getAll,
  update,
  remove,
  bulkImport
} from "../controllers/leadController.js";

const router = express.Router();


// POST /api/leads
router.post("/", create);


// GET /api/leads
router.get("/", getAll);


// PUT /api/leads/:id
router.put("/:id", update);


// DELETE /api/leads/:id
router.delete("/:id", remove);

// POST /api/leads/bulk-import
router.post("/bulk-import", bulkImport);

export default router;