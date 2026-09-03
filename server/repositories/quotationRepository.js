// server/repositories/quotationRepository.js

import pool from "../config/db.js";

// ==========================================
// GET ALL QUOTATIONS
// ==========================================
const getAllQuotations = async () => {
  const connection = await pool.getConnection();

  try {
    const [quotations] = await connection.query(`
      SELECT
        id,
        quotation_id,
        customer_name,
        email,
        phone,
        address,
        state,
        total_amount,
        custom_fields,
        quotation_date,
        created_at,
        updated_at
      FROM quotations
      ORDER BY created_at DESC
    `);

    for (const quotation of quotations) {
      const [items] = await connection.query(
        `
        SELECT
          id,
          quotation_id,
          item_name,
          qty,
          unit,
          price,
          discount,
          tax,
          subtotal
        FROM quotation_items
        WHERE quotation_id = ?
        ORDER BY id ASC
        `,
        [quotation.quotation_id]
      );

      quotation.items = items;
    }

    return quotations;
  } finally {
    connection.release();
  }
};


// ==========================================
// GET SINGLE QUOTATION BY ID
// ==========================================
const getQuotationById = async (id) => {
  const connection = await pool.getConnection();

  try {
    const [quotations] = await connection.query(
      `
      SELECT
        id,
        quotation_id,
        customer_name,
        email,
        phone,
        address,
        state,
        total_amount,
        custom_fields,
        quotation_date,
        created_at,
        updated_at
      FROM quotations
      WHERE id = ?
      `,
      [id]
    );

    if (quotations.length === 0) {
      return null;
    }

    const quotation = quotations[0];

    const [items] = await connection.query(
      `
      SELECT
        id,
        quotation_id,
        item_name,
        qty,
        unit,
        price,
        discount,
        tax,
        subtotal
      FROM quotation_items
      WHERE quotation_id = ?
      ORDER BY id ASC
      `,
      [quotation.quotation_id]
    );

    quotation.items = items;

    return quotation;
  } finally {
    connection.release();
  }
};


// ==========================================
// CREATE QUOTATION
// ==========================================
const createQuotation = async ({
  customerName,
  email,
  phone,
  address,
  state,
  items,
  totalAmount,
  customFields,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Generate next quotation ID
    const [rows] = await connection.query(`
      SELECT COALESCE(MAX(quotation_id), 0) + 1 AS nextQuotationId
      FROM quotations
    `);

    const quotationId = rows[0].nextQuotationId;

    // Insert quotation
    await connection.query(
      `
      INSERT INTO quotations
      (
        quotation_id,
        customer_name,
        email,
        phone,
        address,
        state,
        total_amount,
        custom_fields
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        quotationId,
        customerName,
        email || null,
        phone || null,
        address || null,
        state || null,
        totalAmount,
        JSON.stringify(customFields || {}),
      ]
    );

    // Insert quotation items
    for (const item of items) {
      await connection.query(
        `
        INSERT INTO quotation_items
        (
          quotation_id,
          item_name,
          qty,
          unit,
          price,
          discount,
          tax,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          quotationId,
          item.itemName,
          item.qty,
          item.unit || null,
          item.price,
          item.discount || 0,
          item.tax || 0,
          item.subtotal || 0,
        ]
      );
    }

    await connection.commit();

    // Get created quotation
    const [quotationRows] = await connection.query(
      `
      SELECT
        id,
        quotation_id,
        customer_name,
        email,
        phone,
        address,
        state,
        total_amount,
        custom_fields,
        quotation_date,
        created_at,
        updated_at
      FROM quotations
      WHERE quotation_id = ?
      `,
      [quotationId]
    );

    const quotation = quotationRows[0];

    // Get quotation items
    const [itemRows] = await connection.query(
      `
      SELECT
        id,
        quotation_id,
        item_name,
        qty,
        unit,
        price,
        discount,
        tax,
        subtotal
      FROM quotation_items
      WHERE quotation_id = ?
      ORDER BY id ASC
      `,
      [quotationId]
    );

    quotation.items = itemRows;

    return quotation;

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};


// ==========================================
// EXPORT
// ==========================================
export default {
  getAllQuotations,
  getQuotationById,
  createQuotation,
};