// server/repositories/orderRepository.js

import pool from "../config/db.js";

// ==========================================
// GET ALL ORDERS
// ==========================================
const getAllOrders = async () => {
  const [orders] = await pool.query(`
    SELECT
      id,
      order_id,
      name,
      email,
      phone,
      item,
      quantity,
      amount,
      created_at
    FROM orders
    ORDER BY created_at DESC
  `);

  return orders;
};


// ==========================================
// GET SINGLE ORDER
// ==========================================
const getOrderById = async (id) => {
  const [orders] = await pool.query(
    `
    SELECT
      id,
      order_id,
      name,
      email,
      phone,
      item,
      quantity,
      amount,
      created_at
    FROM orders
    WHERE id = ?
    `,
    [id]
  );

  return orders[0] || null;
};


// ==========================================
// CREATE ORDER
// ==========================================
const createOrder = async ({
  name,
  email,
  phone,
  item,
  quantity,
  amount,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Generate next business order ID
    const [rows] = await connection.query(`
      SELECT COALESCE(MAX(order_id), 0) + 1 AS nextOrderId
      FROM orders
    `);

    const orderId = rows[0].nextOrderId;

    // Insert order
    await connection.query(
      `
      INSERT INTO orders
      (
        order_id,
        name,
        email,
        phone,
        item,
        quantity,
        amount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        orderId,
        name,
        email,
        phone,
        item,
        quantity,
        amount,
      ]
    );

    await connection.commit();

    // Return created order
    const [orders] = await connection.query(
      `
      SELECT
        id,
        order_id,
        name,
        email,
        phone,
        item,
        quantity,
        amount,
        created_at
      FROM orders
      WHERE order_id = ?
      `,
      [orderId]
    );

    return orders[0];

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};


export default {
  getAllOrders,
  getOrderById,
  createOrder,
};