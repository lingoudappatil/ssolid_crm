// server/repositories/leadRepository.js
import pool from "../config/db.js";

// =================== CREATE LEAD ===================

export const createLead = async ({
  name,
  email,
  phone,
  address,
  state,
  source,
  status,
  customFields,
  followUps
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert Lead
    const [leadResult] = await connection.execute(
      `
        INSERT INTO leads
        (
          name,
          email,
          phone,
          address,
          state,
          source,
          status,
          custom_fields
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        email,
        phone,
        address,
        state,
        source,
        status,
        JSON.stringify(customFields || {})
      ]
    );

    const leadId = leadResult.insertId;

    // 2. Insert Lead Follow-ups
    if (Array.isArray(followUps) && followUps.length > 0) {
      for (const followUp of followUps) {
        if (
          followUp.date &&
          followUp.time &&
          followUp.remark
        ) {
          await connection.execute(
            `
              INSERT INTO lead_followups
              (
                lead_id,
                follow_up_date,
                follow_up_time,
                remark
              )
              VALUES (?, ?, ?, ?)
            `,
            [
              leadId,
              followUp.date,
              followUp.time,
              followUp.remark
            ]
          );
        }
      }
    }

    await connection.commit();

    return {
      id: leadId,
      name,
      email,
      phone,
      address,
      state,
      source,
      status,
      customFields: customFields || {},
      followUps: followUps || []
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


// =================== GET LEAD BY ID ===================

export const getLeadById = async (id) => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        name,
        email,
        phone,
        address,
        state,
        source,
        status,
        custom_fields,
        created_at
      FROM leads
      WHERE id = ?
    `,
    [id]
  );

  if (!rows.length) return null;

  const lead = rows[0];
  let customFields = lead.custom_fields;

  if (typeof customFields === "string") {
    try {
      customFields = JSON.parse(customFields);
    } catch {
      customFields = {};
    }
  }

  const [followUps] = await pool.execute(
    `
      SELECT
        id,
        lead_id,
        follow_up_date,
        follow_up_time,
        remark
      FROM lead_followups
      WHERE lead_id = ?
      ORDER BY id ASC
    `,
    [lead.id]
  );

  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    state: lead.state,
    source: lead.source,
    status: lead.status,
    customFields: customFields || {},
    followUps: followUps.map((followUp) => ({
      id: followUp.id,
      date: followUp.follow_up_date,
      time: followUp.follow_up_time,
      remark: followUp.remark
    })),
    createdAt: lead.created_at
  };
};


// =================== UPDATE LEAD ===================

export const updateLeadById = async (id, {
  name,
  email,
  phone,
  address,
  state,
  source,
  status,
  customFields,
  followUps
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [leadResult] = await connection.execute(
      `
        UPDATE leads
        SET
          name = ?,
          email = ?,
          phone = ?,
          address = ?,
          state = ?,
          source = ?,
          status = ?,
          custom_fields = ?
        WHERE id = ?
      `,
      [
        name,
        email,
        phone,
        address,
        state,
        source,
        status,
        JSON.stringify(customFields || {}),
        id
      ]
    );

    if (leadResult.affectedRows === 0) {
      throw new Error("Lead not found");
    }

    if (Array.isArray(followUps)) {
      await connection.execute(
        `DELETE FROM lead_followups WHERE lead_id = ?`,
        [id]
      );

      for (const followUp of followUps) {
        if (followUp.date && followUp.time && followUp.remark) {
          await connection.execute(
            `
              INSERT INTO lead_followups
              (
                lead_id,
                follow_up_date,
                follow_up_time,
                remark
              )
              VALUES (?, ?, ?, ?)
            `,
            [
              id,
              followUp.date,
              followUp.time,
              followUp.remark
            ]
          );
        }
      }
    }

    await connection.commit();

    return await getLeadById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


// =================== GET ALL LEADS ===================

export const getAllLeads = async () => {
  const [leads] = await pool.execute(
    `
      SELECT
        id,
        name,
        email,
        phone,
        address,
        state,
        source,
        status,
        custom_fields,
        created_at
      FROM leads
      ORDER BY id DESC
    `
  );

  // Get all follow-ups
  const [followUps] = await pool.execute(
    `
      SELECT
        id,
        lead_id,
        follow_up_date,
        follow_up_time,
        remark
      FROM lead_followups
      ORDER BY id ASC
    `
  );

  // Attach follow-ups to their Lead
  const result = leads.map((lead) => {

    let customFields = lead.custom_fields;

    // MySQL may return JSON as an object or string
    if (typeof customFields === "string") {
      try {
        customFields = JSON.parse(customFields);
      } catch {
        customFields = {};
      }
    }

    const leadFollowUps = followUps
      .filter((followUp) => followUp.lead_id === lead.id)
      .map((followUp) => ({
        id: followUp.id,
        date: followUp.follow_up_date,
        time: followUp.follow_up_time,
        remark: followUp.remark
      }));

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      state: lead.state,
      source: lead.source,
      status: lead.status,
      customFields: customFields || {},
      followUps: leadFollowUps,
      createdAt: lead.created_at
    };
  });

  return result;
};


// =================== DELETE LEAD ===================

export const deleteLeadById = async (id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Remove related follow-ups first
    await connection.execute(
      `DELETE FROM lead_followups WHERE lead_id = ?`,
      [id]
    );

    // Then remove the lead itself
    const [result] = await connection.execute(
      `DELETE FROM leads WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Lead not found");
    }

    await connection.commit();

    return {
      id: Number(id),
      deleted: true
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =================== BULK CREATE LEADS ===================

export const bulkCreateLeads = async (leads) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let inserted = 0;

    for (const lead of leads) {
      const {
        name,
        email,
        phone,
        address,
        state,
        source,
        status,
        customFields
      } = lead;

      await connection.execute(
        `
          INSERT INTO leads
          (
            name,
            email,
            phone,
            address,
            state,
            source,
            status,
            custom_fields
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name,
          email,
          phone,
          address,
          state,
          source,
          status || "New",
          JSON.stringify(customFields || {})
        ]
      );

      inserted++;
    }

    await connection.commit();

    return {
      inserted
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};