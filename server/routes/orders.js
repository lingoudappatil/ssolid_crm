// server/routes/orders.js

import express from "express";

import {
  getAllOrders,
  getOrderById,
  createOrder,
} from "../controllers/orderController.js";

const router = express.Router();


// ==========================================
// CREATE ORDER
// ==========================================
router.post("/", createOrder);


// ==========================================
// GET ALL ORDERS
// ==========================================
router.get("/", getAllOrders);


// ==========================================
// GET SINGLE ORDER
// ==========================================
router.get("/:id", getOrderById);


export default router;