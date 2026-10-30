// server/repositories/leadRepository.js
import pool from "../config/db.js";

export const getCurrentLeadStatusById = async (id) => {
  const [rows] = await pool.execute(
    `
      SELECT
        l.id AS lead_id,
        l.status_id,
        ls.code AS status_code,
        l.converted_at
      FROM leads l
      INNER JOIN lead_statuses ls
        ON l.status_id = ls.id
      WHERE l.id = ?
        AND l.is_deleted = 0
      LIMIT 1
    `,
    [id]
  );

  if (!rows.length) {
    return null;
  }

  return {
    id: rows[0].lead_id,
    statusId: rows[0].status_id,
    statusCode: rows[0].status_code,
    convertedAt: rows[0].converted_at
  };
};

// =================== CREATE LEAD ===================

export const createLead = async ({
  name,
  firstName,
  lastName,
  companyName,
  jobTitle,
  email,
  phone,
  alternatePhone,
  address,
  state,

  sourceId,
  statusId,
  ownerId,

  rating,
  score,
  expectedValue,

  nextFollowUpAt,
  lastContactedAt,
  convertedAt,

  lostReasonId,

  customFields,
  followUps
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [leadResult] = await connection.execute(
      `
        INSERT INTO leads
        (
          name,
          first_name,
          last_name,
          company_name,
          job_title,

          email,
          phone,
          alternate_phone,

          address,
          state,

          source_id,
          status_id,
          owner_id,

          rating,
          score,
          expected_value,

          next_follow_up_at,
          last_contacted_at,
          converted_at,

          lost_reason_id,
          custom_fields
        )
        VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?
        )
      `,
      [
        name,
        firstName,
        lastName,
        companyName,
        jobTitle,

        email,
        phone,
        alternatePhone,

        address,
        state,

        sourceId,
        statusId,
        ownerId,

        rating,
        score,
        expectedValue,

        nextFollowUpAt,
        lastContactedAt,
        convertedAt,

        lostReasonId,
        JSON.stringify(customFields || {})
      ]
    );

    const leadId = leadResult.insertId;

    // Existing follow-up logic
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

    return await getLeadById(leadId);
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
        l.id,

        -- Existing fields
        l.name,
        l.email,
        l.phone,
        l.address,
        l.state,
        l.source,
        l.status,

        -- New identity fields
        l.first_name,
        l.last_name,
        l.company_name,
        l.job_title,
        l.alternate_phone,

        -- Source
        l.source_id,
        ls.name AS source_name,
        ls.code AS source_code,

        -- Status
        l.status_id,
        lst.name AS status_name,
        lst.code AS status_code,

        -- Owner
        l.owner_id,
        u.name AS owner_name,
        u.email AS owner_email,

        -- Qualification
        l.rating,
        l.score,
        l.expected_value,

        -- Lifecycle
        l.next_follow_up_at,
        l.last_contacted_at,
        l.converted_at,

        -- Lost reason
        l.lost_reason_id,
        lr.name AS lost_reason_name,
        lr.code AS lost_reason_code,

        -- Other
        l.custom_fields,
        l.created_at,
        l.updated_at

      FROM leads l

      LEFT JOIN lead_sources ls
        ON l.source_id = ls.id

      LEFT JOIN lead_statuses lst
        ON l.status_id = lst.id

      LEFT JOIN users u
        ON l.owner_id = u.id

      LEFT JOIN lead_lost_reasons lr
        ON l.lost_reason_id = lr.id

WHERE l.id = ?
  AND l.is_deleted = 0
    `,
    [id]
  );

  if (!rows.length) {
    return null;
  }

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
        DATE_FORMAT(follow_up_date, '%Y-%m-%d') AS follow_up_date,
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

    // Existing compatibility fields
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    state: lead.state,
    source: lead.source,
    status: lead.status,

    // New identity fields
    firstName: lead.first_name,
    lastName: lead.last_name,
    companyName: lead.company_name,
    jobTitle: lead.job_title,
    alternatePhone: lead.alternate_phone,

    // Source
    sourceId: lead.source_id,
    sourceName: lead.source_name,
    sourceCode: lead.source_code,

    // Status
    statusId: lead.status_id,
    statusName: lead.status_name,
    statusCode: lead.status_code,

    // Owner
    ownerId: lead.owner_id,
    ownerName: lead.owner_name,
    ownerEmail: lead.owner_email,

    // Qualification
    rating: lead.rating,
    score: lead.score,
    expectedValue: lead.expected_value,

    // Lifecycle
    nextFollowUpAt: lead.next_follow_up_at,
    lastContactedAt: lead.last_contacted_at,
    convertedAt: lead.converted_at,

    // Lost reason
    lostReasonId: lead.lost_reason_id,
    lostReasonName: lead.lost_reason_name,
    lostReasonCode: lead.lost_reason_code,

    // Custom fields
    customFields: customFields || {},

    // Follow-ups
    followUps: followUps.map((followUp) => ({
      id: followUp.id,
      date: followUp.follow_up_date,
      time: followUp.follow_up_time,
      remark: followUp.remark
    })),

    createdAt: lead.created_at,
    updatedAt: lead.updated_at
  };
};

// =================== UPDATE LEAD ===================

export const updateLeadById = async (id, data, expectedCurrentStatusId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // -----------------------------------------
    // Lock the active lead so it cannot be archived during this update.
    // -----------------------------------------

    const [existingRows] = await connection.execute(
      `
      SELECT id, status_id
      FROM leads
      WHERE id = ?
        AND is_deleted = 0
      LIMIT 1
      FOR UPDATE
      `,
      [id]
    );

    if (existingRows.length === 0) {
      const error = new Error("Lead not found");
      error.statusCode = 404;
      throw error;
    }

    if (existingRows[0].status_id !== expectedCurrentStatusId) {
      const error = new Error(
        "Lead status changed while updating; please reload and try again"
      );
      error.statusCode = 400;
      throw error;
    }


    // -----------------------------------------
    // Get source name
    // -----------------------------------------

    const [sourceRows] = await connection.execute(
      `
      SELECT id, name
      FROM lead_sources
      WHERE id = ?
      LIMIT 1
      `,
      [data.sourceId]
    );

    if (sourceRows.length === 0) {
      const error = new Error("Invalid lead source");
      error.statusCode = 400;
      throw error;
    }

    const sourceName = sourceRows[0].name;


    // -----------------------------------------
    // Get status name
    // -----------------------------------------

    const [statusRows] = await connection.execute(
      `
      SELECT id, name
      FROM lead_statuses
      WHERE id = ?
        AND is_active = 1
      LIMIT 1
      `,
      [data.statusId]
    );

    if (statusRows.length === 0) {
      const error = new Error("Invalid or inactive lead status");
      error.statusCode = 400;
      throw error;
    }

    const statusName = statusRows[0].name;


    // -----------------------------------------
    // Update lead
    // -----------------------------------------

    await connection.execute(
      `
      UPDATE leads
      SET
        name = ?,
        first_name = ?,
        last_name = ?,
        company_name = ?,
        job_title = ?,
        email = ?,
        phone = ?,
        alternate_phone = ?,
        address = ?,
        state = ?,

        source = ?,
        source_id = ?,

        status = ?,
        status_id = ?,

        owner_id = ?,
        rating = ?,
        score = ?,
        expected_value = ?,
        next_follow_up_at = ?,
        last_contacted_at = ?,
        converted_at = ?,
        lost_reason_id = ?,
        custom_fields = ?

      WHERE id = ?
        AND is_deleted = 0
      `,
      [
        data.name,
        data.firstName,
        data.lastName,
        data.companyName,
        data.jobTitle,
        data.email,
        data.phone,
        data.alternatePhone,
        data.address,
        data.state,

        // old field + new field
        sourceName,
        data.sourceId,

        // old field + new field
        statusName,
        data.statusId,

        data.ownerId,
        data.rating,
        data.score,
        data.expectedValue,
        data.nextFollowUpAt,
        data.lastContactedAt,
        data.convertedAt,
        data.lostReasonId,

        JSON.stringify(data.customFields || {}),

        id
      ]
    );


    // -----------------------------------------
    // Update follow-ups
    // -----------------------------------------

    if (Array.isArray(data.followUps)) {

      await connection.execute(
        `
        DELETE FROM lead_followups
        WHERE lead_id = ?
        `,
        [id]
      );


      for (const followUp of data.followUps) {

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
            followUp.date || null,
            followUp.time || null,
            followUp.remark || null
          ]
        );

      }
    }


    await connection.commit();


    // -----------------------------------------
    // Return updated lead
    // -----------------------------------------

    return await getLeadById(id);

  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =================== GET ALL LEADS ===================

const getLeadsByDeletedStatus = async (isDeleted) => {
  const [leads] = await pool.execute(`
    SELECT
      l.id,

      -- Existing fields
      l.name,
      l.email,
      l.phone,
      l.address,
      l.state,
      l.source,
      l.status,

      -- New Lead identity fields
      l.first_name,
      l.last_name,
      l.company_name,
      l.job_title,
      l.alternate_phone,

      -- Master relationships
      l.source_id,
      ls.name AS source_name,
      ls.code AS source_code,

      l.status_id,
      lst.name AS status_name,
      lst.code AS status_code,

      -- Ownership
      l.owner_id,
      u.name AS owner_name,
      u.email AS owner_email,

      -- Lead qualification
      l.rating,
      l.score,
      l.expected_value,

      -- Activity / lifecycle
      l.next_follow_up_at,
      l.last_contacted_at,
      l.converted_at,

      -- Lost reason
      l.lost_reason_id,
      lr.name AS lost_reason_name,
      lr.code AS lost_reason_code,

      -- Custom fields / timestamps
      l.custom_fields,
      l.created_at,
      l.updated_at

    FROM leads l
    LEFT JOIN lead_sources ls
      ON l.source_id = ls.id

    LEFT JOIN lead_statuses lst
      ON l.status_id = lst.id

    LEFT JOIN users u
      ON l.owner_id = u.id

    LEFT JOIN lead_lost_reasons lr
      ON l.lost_reason_id = lr.id
    WHERE l.is_deleted = ?

    ORDER BY l.id DESC
  `, [isDeleted]);

  const [followUps] = await pool.execute(`
    SELECT
      id,
      lead_id,
      DATE_FORMAT(follow_up_date, '%Y-%m-%d') AS follow_up_date,
      follow_up_time,
      remark
    FROM lead_followups
    ORDER BY id ASC
  `);

  const result = leads.map((lead) => {
    let customFields = lead.custom_fields;

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

      // Existing compatibility fields
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      state: lead.state,
      source: lead.source,
      status: lead.status,

      // New identity fields
      firstName: lead.first_name,
      lastName: lead.last_name,
      companyName: lead.company_name,
      jobTitle: lead.job_title,
      alternatePhone: lead.alternate_phone,

      // Source
      sourceId: lead.source_id,
      sourceName: lead.source_name,
      sourceCode: lead.source_code,

      // Status
      statusId: lead.status_id,
      statusName: lead.status_name,
      statusCode: lead.status_code,

      // Owner
      ownerId: lead.owner_id,
      ownerName: lead.owner_name,
      ownerEmail: lead.owner_email,

      // Qualification
      rating: lead.rating,
      score: lead.score,
      expectedValue: lead.expected_value,

      // Lifecycle
      nextFollowUpAt: lead.next_follow_up_at,
      lastContactedAt: lead.last_contacted_at,
      convertedAt: lead.converted_at,

      // Lost reason
      lostReasonId: lead.lost_reason_id,
      lostReasonName: lead.lost_reason_name,
      lostReasonCode: lead.lost_reason_code,

      // Other
      customFields: customFields || {},
      followUps: leadFollowUps,

      createdAt: lead.created_at,
      updatedAt: lead.updated_at
    };
  });

  return result;
};

export const getAllLeads = async () => getLeadsByDeletedStatus(0);

export const getArchivedLeads = async () => getLeadsByDeletedStatus(1);


// =================== DELETE LEAD ===================


export const deleteLeadById = async (id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the row before distinguishing a missing lead from a duplicate archive.
    const [rows] = await connection.execute(
      `SELECT id, is_deleted
       FROM leads
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    if (rows.length === 0) {
      const error = new Error("Lead not found");
      error.statusCode = 404;
      throw error;
    }

    if (rows[0].is_deleted) {
      const error = new Error("Lead is already archived");
      error.statusCode = 400;
      throw error;
    }

    // Archive the lead instead of permanently deleting it
    await connection.execute(
      `UPDATE leads
       SET is_deleted = 1,
           deleted_at = NOW()
       WHERE id = ? AND is_deleted = 0`,
      [id]
    );

    await connection.commit();

    return {
      id: Number(id),
      isDeleted: true,
      message: "Lead archived successfully"
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


 // =================== RESTORE LEAD ===================

export const restoreLeadById = async (id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `
      SELECT id, is_deleted
      FROM leads
      WHERE id = ?
      FOR UPDATE
      `,
      [id]
    );

    if (rows.length === 0) {
      const error = new Error("Lead not found");
      error.statusCode = 404;
      throw error;
    }

    if (!rows[0].is_deleted) {
      const error = new Error("Lead is already active");
      error.statusCode = 400;
      throw error;
    }

    // Restore the existing record
    await connection.execute(
      `
      UPDATE leads
      SET is_deleted = 0,
          deleted_at = NULL
      WHERE id = ? AND is_deleted = 1
      `,
      [id]
    );

    await connection.commit();

    // Return the restored lead using the existing GET mapping
    return await getLeadById(id);

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
