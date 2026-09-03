import express from "express";

import {
  create,
  getAll,
  update,
  remove
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


export default router;