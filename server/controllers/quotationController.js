// server/controllers/quotationController.js

import quotationService from "../services/quotationService.js";

// ==========================================
// Convert SQL quotation → API response
// ==========================================
const formatQuotation = (quotation) => {
  if (!quotation) {
    return null;
  }

  return {
    id: quotation.id,
    quotationId: quotation.quotation_id,

    // Same formatted quotation number
    quotationNumber: `Q-${String(
      quotation.quotation_id
    ).padStart(5, "0")}`,

    customerName: quotation.customer_name,
    email: quotation.email,
    phone: quotation.phone,
    address: quotation.address,
    state: quotation.state,

    items: (quotation.items || []).map((item) => ({
      id: item.id,
      quotationId: item.quotation_id,
      itemName: item.item_name,
      qty: Number(item.qty),
      unit: item.unit,
      price: Number(item.price),
      discount: Number(item.discount),
      tax: Number(item.tax),
      subtotal: Number(item.subtotal),
    })),

    totalAmount: Number(quotation.total_amount),

    customFields:
      quotation.custom_fields || {},

    date: quotation.quotation_date,
    createdAt: quotation.created_at,
    updatedAt: quotation.updated_at,
  };
};


// ==========================================
// GET ALL QUOTATIONS
// ==========================================
export const getAllQuotations = async (req, res) => {
  try {
    const quotations =
      await quotationService.getAllQuotations();

    const formatted = quotations.map(
      formatQuotation
    );

    res.json(formatted);
  } catch (error) {
    console.error(
      "❌ Error fetching quotations:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};


// ==========================================
// GET SINGLE QUOTATION
// ==========================================
export const getQuotationById = async (req, res) => {
  try {
    const quotation =
      await quotationService.getQuotationById(
        req.params.id
      );

    if (!quotation) {
      return res.status(404).json({
        error: "Quotation not found",
      });
    }

    res.json(formatQuotation(quotation));
  } catch (error) {
    console.error(
      "❌ Error fetching quotation:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};


// ==========================================
// CREATE QUOTATION
// ==========================================
export const createQuotation = async (req, res) => {
  try {
    console.log(
      "📦 Incoming quotation:",
      req.body
    );

    const quotation =
      await quotationService.createQuotation(
        req.body
      );

    res.status(201).json({
      message: "Quotation added successfully!",
      quotation: formatQuotation(quotation),
    });
  } catch (error) {
    console.error(
      "❌ Error saving quotation:",
      error
    );

    res.status(400).json({
      error: error.message,
    });
  }
};