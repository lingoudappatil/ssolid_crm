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