import pool from "../config/db.js";

export const getAllLeadStatuses = async () => {
  const [rows] = await pool.execute(`
    SELECT
      id,
      name,
      code,
      sort_order,
      is_active,
      is_closed,
      created_at,
      updated_at
    FROM lead_statuses
    WHERE is_active = 1
    ORDER BY sort_order ASC
  `);

  return rows;
};


// Get one status by ID
export const getLeadStatusById = async (statusId) => {
  const [rows] = await pool.execute(
    `
    SELECT
      id,
      name,
      code,
      sort_order,
      is_active,
      is_closed
    FROM lead_statuses
    WHERE id = ?
    LIMIT 1
    `,
    [statusId]
  );

  return rows[0] || null;
};

export const getLeadLostReasonById = async (lostReasonId) => {
  const [rows] = await pool.execute(
    `
    SELECT
      id,
      name,
      code,
      is_active
    FROM lead_lost_reasons
    WHERE id = ?
      AND is_active = 1
    LIMIT 1
    `,
    [lostReasonId]
  );

  return rows[0] || null;
};


// Your existing functions below
export const getAllLeadSources = async () => {
  const [rows] = await pool.execute(`
    SELECT
      id,
      name,
      code,
      is_active,
      created_at,
      updated_at
    FROM lead_sources
    WHERE is_active = 1
    ORDER BY name ASC
  `);

  return rows;
};

export const getAllLeadLostReasons = async () => {
  const [rows] = await pool.execute(`
    SELECT
      id,
      name,
      code,
      is_active,
      created_at,
      updated_at
    FROM lead_lost_reasons
    WHERE is_active = 1
    ORDER BY name ASC
  `);

  return rows;
};