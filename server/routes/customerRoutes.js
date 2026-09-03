import express from "express";

import {
  create,
  getAll
} from "../controllers/customerController.js";

const router = express.Router();


// POST /api/customers
router.post("/", create);


// GET /api/customers
router.get("/", getAll);


export default router;