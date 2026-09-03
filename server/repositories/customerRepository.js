import pool from "../config/db.js";

// =================== CREATE CUSTOMER ===================

export const createCustomer = async ({
  name,
  email,
  phone,
  address,
  state
}) => {
  const [result] = await pool.execute(
    `
      INSERT INTO customers
      (name, email, phone, address, state)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      name,
      email,
      phone,
      address,
      state
    ]
  );

  return {
    id: result.insertId,
    name,
    email,
    phone,
    address,
    state
  };
};


// =================== GET ALL CUSTOMERS ===================

export const getAllCustomers = async () => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        name,
        email,
        phone,
        address,
        state
      FROM customers
      ORDER BY id DESC
    `
  );

  return rows;
};