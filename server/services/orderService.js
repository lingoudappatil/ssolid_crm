// server/services/orderService.js

import orderRepository from "../repositories/orderRepository.js";

// ==========================================
// GET ALL ORDERS
// ==========================================
const getAllOrders = async () => {
  return await orderRepository.getAllOrders();
};


// ==========================================
// GET SINGLE ORDER
// ==========================================
const getOrderById = async (id) => {
  if (!id) {
    throw new Error("Order ID is required");
  }

  return await orderRepository.getOrderById(id);
};


// ==========================================
// CREATE ORDER
// ==========================================
const createOrder = async ({
  name,
  email,
  phone,
  item,
  quantity,
  price,
  tax,
  discountPercent = 0,
  discountAmount = 0,
}) => {

  // ==========================================
  // REQUIRED FIELD VALIDATION
  // ==========================================

  if (!name || !name.trim()) {
    throw new Error("Customer name is required");
  }

  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }

  if (!phone || !phone.trim()) {
    throw new Error("Phone is required");
  }

  if (!item || !item.trim()) {
    throw new Error("Item name is required");
  }


  // ==========================================
  // CONVERT NUMERIC VALUES
  // ==========================================

  const parsedQuantity = Number(quantity);
  const parsedPrice = Number(price);
  const parsedTax = Number(tax);
  const parsedDiscountPercent =
    Number(discountPercent);
  const parsedDiscountAmount =
    Number(discountAmount);


  // ==========================================
  // NUMERIC VALIDATION
  // ==========================================

  if (
    Number.isNaN(parsedQuantity) ||
    parsedQuantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than 0"
    );
  }

  if (
    Number.isNaN(parsedPrice) ||
    parsedPrice <= 0
  ) {
    throw new Error(
      "Price must be greater than 0"
    );
  }

  if (
    Number.isNaN(parsedTax) ||
    parsedTax < 0
  ) {
    throw new Error(
      "Tax must be non-negative"
    );
  }

  if (
    Number.isNaN(parsedDiscountPercent) ||
    parsedDiscountPercent < 0 ||
    parsedDiscountPercent > 100
  ) {
    throw new Error(
      "Discount percentage must be between 0 and 100"
    );
  }

  if (
    Number.isNaN(parsedDiscountAmount) ||
    parsedDiscountAmount < 0
  ) {
    throw new Error(
      "Discount amount must be non-negative"
    );
  }


  // ==========================================
  // EMAIL VALIDATION
  // ==========================================

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    throw new Error("Invalid email format");
  }


  // ==========================================
  // PHONE VALIDATION
  // ==========================================

  const phoneRegex =
    /^\+?[\d\s-]{10,}$/;

  if (!phoneRegex.test(phone.trim())) {
    throw new Error(
      "Invalid phone number format"
    );
  }


  // ==========================================
  // ORDER CALCULATIONS
  // ==========================================

  // Subtotal
  const subtotal =
    parsedQuantity * parsedPrice;

  // Percentage discount
  const percentDiscount =
    (subtotal * parsedDiscountPercent) / 100;

  // Total discount
  const totalDiscount =
    percentDiscount + parsedDiscountAmount;

  // Prevent negative order amount
  if (totalDiscount > subtotal) {
    throw new Error(
      "Total discount cannot be greater than subtotal"
    );
  }

  // Amount after discount
  const amountAfterDiscount =
    subtotal - totalDiscount;

  // Tax
  const taxAmount =
    (amountAfterDiscount * parsedTax) / 100;

  // Final amount
  const totalAmount =
    amountAfterDiscount + taxAmount;


  console.log("🧩 Order calculation:");
  console.log("Customer:", name);
  console.log("Item:", item);
  console.log("Quantity:", parsedQuantity);
  console.log("Price:", parsedPrice);
  console.log("Subtotal:", subtotal);
  console.log("Discount:", totalDiscount);
  console.log("Tax:", taxAmount);
  console.log(
    "Final Amount:",
    totalAmount.toFixed(2)
  );


  // ==========================================
  // SAVE TO MYSQL
  // ==========================================

  return await orderRepository.createOrder({
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    item: item.trim(),
    quantity: parsedQuantity,
    amount: Number(totalAmount.toFixed(2)),
  });
};


export default {
  getAllOrders,
  getOrderById,
  createOrder,
};