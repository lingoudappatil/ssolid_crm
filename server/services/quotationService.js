// server/services/quotationService.js

import quotationRepository from "../repositories/quotationRepository.js";

// ==========================================
// GET ALL QUOTATIONS
// ==========================================
const getAllQuotations = async () => {
  return await quotationRepository.getAllQuotations();
};


// ==========================================
// GET SINGLE QUOTATION
// ==========================================
const getQuotationById = async (id) => {
  if (!id) {
    throw new Error("Quotation ID is required");
  }

  return await quotationRepository.getQuotationById(id);
};


// ==========================================
// CREATE QUOTATION
// ==========================================
const createQuotation = async (data) => {
  const {
    customerName,
    email,
    phone,
    address,
    state,
    items,
    totalAmount,
    customFields,
  } = data;

  // Customer validation
  if (!customerName || !customerName.trim()) {
    throw new Error("Customer name is required");
  }

  // Items validation
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one item is required");
  }

  // Validate every item
  for (const item of items) {
    if (!item.itemName || !item.itemName.trim()) {
      throw new Error("Each item must have a valid name");
    }

    const qty = Number(item.qty);
    const price = Number(item.price);

    if (Number.isNaN(qty) || qty <= 0) {
      throw new Error(
        "Each item must have a valid quantity greater than 0"
      );
    }

    if (Number.isNaN(price) || price < 0) {
      throw new Error(
        "Each item must have a valid price"
      );
    }
  }

  // Total amount
  const parsedTotalAmount = Number(totalAmount);

  if (
    Number.isNaN(parsedTotalAmount) ||
    parsedTotalAmount < 0
  ) {
    throw new Error("Valid total amount is required");
  }

  // Prepare items
  const preparedItems = items.map((item) => ({
    itemName: item.itemName.trim(),
    qty: Number(item.qty),
    unit: item.unit ? String(item.unit).trim() : null,
    price: Number(item.price),
    discount: Number(item.discount || 0),
    tax: Number(item.tax || 0),
    subtotal: Number(item.subtotal || 0),
  }));

  return await quotationRepository.createQuotation({
    customerName: customerName.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    state: state?.trim() || null,
    items: preparedItems,
    totalAmount: parsedTotalAmount,
    customFields: customFields || {},
  });
};


export default {
  getAllQuotations,
  getQuotationById,
  createQuotation,
};