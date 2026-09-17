//server/services/leadService.js
// =================== LEAD SERVICE ===================
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadById,
  deleteLeadById
} from "../repositories/leadRepository.js";


// =================== CREATE LEAD ===================

export const addLead = async ({
  name,
  email,
  phone,
  address,
  state,
  source,
  Source,
  status,
  customFields,
  followUps
}) => {

  // Validate required fields
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

  return await createLead({
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    address: address.trim(),
    state: state.trim(),
    source: (source || Source || "").trim(),
    status: status || "New",
    customFields: customFields || {},
    followUps: Array.isArray(followUps) ? followUps : []
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

export const getLeads = async () => {
  return await getAllLeads();
};


// =================== UPDATE LEAD ===================

export const updateLead = async (id, payload) => {
  const {
    name,
    email,
    phone,
    address,
    state,
    source,
    Source,
    status,
    customFields,
    followUps
  } = payload || {};

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

  const existingLead = await getLeadById(id);
  if (!existingLead) {
    throw new Error("Lead not found");
  }

  const updatedLead = await updateLeadById(id, {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    address: address.trim(),
    state: state.trim(),
    source: (source || Source || existingLead.source || "").trim(),
    status: status || existingLead.status || "New",
    customFields: customFields || existingLead.customFields || {},
    followUps: Array.isArray(followUps) ? followUps : existingLead.followUps || []
  });

  return updatedLead;
};


// =================== DELETE LEAD ===================

export const deleteLead = async (id) => {
  if (!id || Number.isNaN(Number(id))) {
    throw new Error("Valid lead id is required");
  }

  const existingLead = await getLeadById(id);

  if (!existingLead) {
    throw new Error("Lead not found");
  }

  return await deleteLeadById(id);
};