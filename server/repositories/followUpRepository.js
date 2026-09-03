import pool from "../config/db.js";

const getAllFollowUps = async () => {
  const [rows] = await pool.query(`
    SELECT
      id,
      lead_id,
      quotation_id,
      follow_up_date,
      notes,
      status,
      created_at
    FROM follow_ups
    ORDER BY follow_up_date ASC
  `);

  return rows;
};

const createFollowUp = async ({
  relatedType,
  relatedId,
  followUpDate,
  notes,
  status,
}) => {
  let leadId = null;
  let quotationId = null;

  if (relatedType === "Lead") {
    leadId = Number(relatedId);
  } else if (relatedType === "Quotation") {
    quotationId = Number(relatedId);
  }

  const [result] = await pool.query(
    `
      INSERT INTO follow_ups
      (
        lead_id,
        quotation_id,
        follow_up_date,
        notes,
        status
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      leadId,
      quotationId,
      followUpDate,
      notes || null,
      status || "Pending",
    ]
  );

  const [rows] = await pool.query(
    `
      SELECT
        id,
        lead_id,
        quotation_id,
        follow_up_date,
        notes,
        status,
        created_at
      FROM follow_ups
      WHERE id = ?
    `,
    [result.insertId]
  );

  return rows[0];
};

export default {
  getAllFollowUps,
  createFollowUp,
};