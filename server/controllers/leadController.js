import {
  addLead,
  getLeads,
  updateLead,
  deleteLead,
    bulkImportLeads 
} from "../services/leadService.js";


// =================== CREATE LEAD ===================

export const create = async (req, res) => {
  try {

    const lead = await addLead(req.body);

    res.status(201).json({
      message: "Lead added successfully!",
      lead
    });

  } catch (error) {

    console.error("Error creating lead:", error);

    res.status(400).json({
      error: error.message
    });
  }
};


// =================== GET ALL LEADS ===================

export const getAll = async (req, res) => {
  try {

    const leads = await getLeads();

    res.status(200).json(leads);

  } catch (error) {

    console.error("Error fetching leads:", error);

    res.status(500).json({
      error: "Failed to fetch leads"
    });
  }
};


// =================== UPDATE LEAD ===================

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await updateLead(id, req.body);

    res.status(200).json({
      message: "Lead updated successfully!",
      lead
    });

  } catch (error) {
    console.error("Error updating lead:", error);

    const statusCode = error.message === "Lead not found" ? 404 : 400;

    res.status(statusCode).json({
      error: error.message
    });
  }
};


// =================== DELETE LEAD ===================

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteLead(id);

    res.status(200).json({
      message: "Lead deleted successfully!",
      lead: result
    });

  } catch (error) {
    console.error("Error deleting lead:", error);

    const statusCode = error.message === "Lead not found" ? 404 : 400;

    res.status(statusCode).json({
      error: error.message
    });
  }
};

// =================== BULK IMPORT LEADS ===================

export const bulkImport = async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        error: "No leads provided for import"
      });
    }

    const result = await bulkImportLeads(leads);

    res.status(200).json({
      message: "Bulk import completed successfully!",
      ...result
    });

  } catch (error) {
    console.error("Error importing leads in bulk:", error);

    res.status(500).json({
      error: error.message
    });
  }
};