// server/controllers/orderController.js

import orderService from "../services/orderService.js";

// ==========================================
// FORMAT ORDER RESPONSE
// ==========================================
const formatOrder = (order) => {
  if (!order) {
    return null;
  }

  return {
    id: order.id,
    orderId: order.order_id,
    name: order.name,
    email: order.email,
    phone: order.phone,
    item: order.item,
    quantity: Number(order.quantity),
    amount: Number(order.amount),
    createdAt: order.created_at,
  };
};


// ==========================================
// GET ALL ORDERS
// ==========================================
export const getAllOrders = async (req, res) => {
  try {
    const orders =
      await orderService.getAllOrders();

    res.json(
      orders.map(formatOrder)
    );

  } catch (error) {
    console.error(
      "❌ Error fetching orders:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET SINGLE ORDER
// ==========================================
export const getOrderById = async (req, res) => {
  try {
    const order =
      await orderService.getOrderById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: formatOrder(order),
    });

  } catch (error) {
    console.error(
      "❌ Error fetching order:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// CREATE ORDER
// ==========================================
export const createOrder = async (req, res) => {
  try {
    console.log(
      "📦 Incoming order:",
      req.body
    );

    const order =
      await orderService.createOrder(
        req.body
      );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: formatOrder(order),
    });

  } catch (error) {
    console.error(
      "❌ Error creating order:",
      error
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};