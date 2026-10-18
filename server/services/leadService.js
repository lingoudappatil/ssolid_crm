//server/services/leadService.js
// =================== LEAD SERVICE ===================
import {
  createLead,
  getLeadById,
  updateLeadById,
  getAllLeads,
  deleteLeadById,
  restoreLeadById,
  bulkCreateLeads
} from "../repositories/leadRepository.js";

import {
  getLeadStatusById
} from "../repositories/leadMasterRepository.js";
// =================== CREATE LEAD ===================

export const addLead = async ({
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
  // Basic validation
  if (!name || !name.trim()) {
    throw new Error("Name is required");
  }

  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }

  if (!phone || !phone.trim()) {
    throw new Error("Phone is required");
  }

  if (!address || !address.trim()) {
    throw new Error("Address is required");
  }

  if (!state || !state.trim()) {
    throw new Error("State is required");
  }

  // Source validation
  if (!sourceId) {
    throw new Error("Source is required");
  }

  // Status validation
  if (!statusId) {
    throw new Error("Status is required");
  }

  // Rating validation
  if (
    rating !== null &&
    rating !== undefined &&
    !["Cold", "Warm", "Hot"].includes(rating)
  ) {
    throw new Error("Invalid rating. Allowed values: Cold, Warm, Hot");
  }

  // Score validation
  if (
    score !== null &&
    score !== undefined &&
    (Number.isNaN(Number(score)) ||
      Number(score) < 0 ||
      Number(score) > 100)
  ) {
    throw new Error("Score must be between 0 and 100");
  }

  // Expected value validation
  if (
    expectedValue !== null &&
    expectedValue !== undefined &&
    (Number.isNaN(Number(expectedValue)) ||
      Number(expectedValue) < 0)
  ) {
    throw new Error("Expected value must be a positive amount in paise");
  }

  // Lost reason validation
  if (lostReasonId && !statusId) {
    throw new Error("Status is required when using a lost reason");
  }

  return await createLead({
    name: name.trim(),

    firstName: firstName?.trim() || null,
    lastName: lastName?.trim() || null,
    companyName: companyName?.trim() || null,
    jobTitle: jobTitle?.trim() || null,

    email: email.trim(),
    phone: phone.trim(),
    alternatePhone: alternatePhone?.trim() || null,

    address: address.trim(),
    state: state.trim(),

    sourceId,
    statusId,
    ownerId: ownerId || null,

    rating: rating || null,
    score:
      score !== null && score !== undefined
        ? Number(score)
        : null,

    expectedValue:
      expectedValue !== null && expectedValue !== undefined
        ? Number(expectedValue)
        : null,

    nextFollowUpAt: nextFollowUpAt || null,
    lastContactedAt: lastContactedAt || null,
    convertedAt: convertedAt || null,

    lostReasonId: lostReasonId || null,

    customFields:
      customFields &&
      typeof customFields === "object" &&
      !Array.isArray(customFields)
        ? customFields
        : {},

    followUps: Array.isArray(followUps)
      ? followUps
      : []
  });
};

// =================== BULK IMPORT LEADS ===================

export const bulkImportLeads = async (leads) => {
  if (!Array.isArray(leads) || leads.length === 0) {
    throw new Error("No leads provided for import");
  }

  const validLeads = [];
  const errors = [];
const allowedSources = [
  "Friend",
  "Walk In",
  "Social Media",
  "Other"
];

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i] || {};

    // Row 1 is normally the CSV header.
    // Therefore, data starts from row 2.
    const rowNumber = i + 2;

    try {
      const name = lead.name ? String(lead.name).trim() : "";
      const email = lead.email ? String(lead.email).trim() : "";
      const phone = lead.phone ? String(lead.phone).trim() : "";
      const address = lead.address ? String(lead.address).trim() : "";
      const state = lead.state ? String(lead.state).trim() : "";
      const source = String(
        lead.source || lead.Source || ""
      ).trim();

      const status = lead.status
        ? String(lead.status).trim()
        : "New";

      // Required field validation
      if (!name) {
        throw new Error("Name is required");
      }

      if (!email) {
        throw new Error("Email is required");
      }

      if (!phone) {
        throw new Error("Phone is required");
      }

      if (!address) {
        throw new Error("Address is required");
      }

      if (!state) {
        throw new Error("State is required");
      }

      if (!source) {
        throw new Error("Source is required");
      }
if (!allowedSources.includes(source)) {
  throw new Error(
    `Invalid source. Allowed values: ${allowedSources.join(", ")}`
  );
}
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
      }

      // Custom fields are optional
      let customFields = {};

      if (
        lead.customFields &&
        typeof lead.customFields === "object" &&
        !Array.isArray(lead.customFields)
      ) {
        customFields = lead.customFields;
      }

      validLeads.push({
        row: rowNumber,
        name,
        lead: {
          name,
          email,
          phone,
          address,
          state,
          source,
          status,
          customFields
        }
      });

    } catch (error) {
      errors.push({
        row: rowNumber,
        name: lead.name || "",
        reason: error.message
      });
    }
  }

  let inserted = 0;

  for (const validLead of validLeads) {
    try {
      await createLead(validLead.lead);
      inserted += 1;
    } catch (error) {
      errors.push({
        row: validLead.row,
        name: validLead.name,
        reason: error.message || "Failed to insert lead"
      });
    }
  }

  return {
    total: leads.length,
    inserted,
    failed: errors.length,
    errors
  };
};

// =================== GET LEADS ===================

export const updateLead = async (id, data) => {
  // -----------------------------------------
  // 1. BASIC VALIDATION
  // -----------------------------------------

  if (!data.name || !data.name.trim()) {
    throw new Error("Lead name is required");
  }

  if (!data.email || !data.email.trim()) {
    throw new Error("Email is required");
  }

  if (!data.phone || !data.phone.trim()) {
    throw new Error("Phone is required");
  }

  if (!data.address || !data.address.trim()) {
    throw new Error("Address is required");
  }

  if (!data.state || !data.state.trim()) {
    throw new Error("State is required");
  }

  if (!data.sourceId) {
    throw new Error("Lead source is required");
  }

  if (!data.statusId) {
    throw new Error("Lead status is required");
  }


  // -----------------------------------------
  // 2. EMAIL VALIDATION
  // -----------------------------------------

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(data.email.trim())) {
    throw new Error("Invalid email format");
  }


  // -----------------------------------------
  // 3. GET STATUS FROM MASTER TABLE
  // -----------------------------------------

  const status = await getLeadStatusById(data.statusId);

  if (!status) {
    throw new Error("Invalid lead status");
  }

  if (!status.is_active) {
    throw new Error("Selected lead status is inactive");
  }


  // -----------------------------------------
  // 4. STATUS = LOST
  // LOST MUST HAVE A LOST REASON
  // -----------------------------------------

  if (status.code === "LOST" && !data.lostReasonId) {
    throw new Error(
      "Lost reason is required when lead status is Lost"
    );
  }


  // -----------------------------------------
  // 5. IF STATUS IS NOT LOST
  // REMOVE LOST REASON
  // -----------------------------------------

  let lostReasonId = data.lostReasonId || null;

  if (status.code !== "LOST") {
    lostReasonId = null;
  }


  // -----------------------------------------
  // 6. RATING VALIDATION
  // -----------------------------------------

  if (
    data.rating &&
    !["Cold", "Warm", "Hot"].includes(data.rating)
  ) {
    throw new Error(
      "Rating must be Cold, Warm, or Hot"
    );
  }


  // -----------------------------------------
  // 7. SCORE VALIDATION
  // -----------------------------------------

  if (
    data.score !== undefined &&
    data.score !== null &&
    (Number(data.score) < 0 || Number(data.score) > 100)
  ) {
    throw new Error(
      "Lead score must be between 0 and 100"
    );
  }


  // -----------------------------------------
  // 8. EXPECTED VALUE VALIDATION
  // -----------------------------------------

  if (
    data.expectedValue !== undefined &&
    data.expectedValue !== null &&
    Number(data.expectedValue) < 0
  ) {
    throw new Error(
      "Expected value cannot be negative"
    );
  }


  // -----------------------------------------
  // 9. CONVERTED DATE
  // -----------------------------------------

  let convertedAt = data.convertedAt || null;

  if (status.code === "CONVERTED") {
    convertedAt = convertedAt || new Date();
  }


  // -----------------------------------------
  // 10. PREPARE DATA
  // -----------------------------------------

  const updateData = {
    name: data.name.trim(),

    firstName: data.firstName || null,

    lastName: data.lastName || null,

    companyName: data.companyName || null,

    jobTitle: data.jobTitle || null,

    email: data.email.trim(),

    phone: data.phone.trim(),

    alternatePhone: data.alternatePhone || null,

    address: data.address.trim(),

    state: data.state.trim(),

    sourceId: data.sourceId,

    statusId: data.statusId,

    ownerId: data.ownerId || null,

    rating: data.rating || null,

    score:
      data.score !== undefined && data.score !== null
        ? Number(data.score)
        : null,

    expectedValue:
      data.expectedValue !== undefined &&
      data.expectedValue !== null
        ? Number(data.expectedValue)
        : null,

    nextFollowUpAt: data.nextFollowUpAt || null,

    lastContactedAt: data.lastContactedAt || null,

    convertedAt,

    lostReasonId,

    customFields: data.customFields || {},

    followUps: data.followUps || []
  };


  // -----------------------------------------
  // 11. UPDATE DATABASE
  // -----------------------------------------

  return await updateLeadById(id, updateData);
};


// =================== DELETE LEAD ===================


export const deleteLead = async (id) => {
  const leadId = Number(id);

  if (!Number.isInteger(leadId) || leadId <= 0) {
    throw new Error("Invalid lead ID");
  }

  return await deleteLeadById(leadId);
};
export const getLeads = async () => {
  return await getAllLeads();
};
// =================== RESTORE LEAD ===================
export const restoreLead = async (id) => {
  const leadId = Number(id);

  if (!Number.isInteger(leadId) || leadId <= 0) {
    throw new Error("Invalid lead ID");
  }

  return await restoreLeadById(leadId);
};
