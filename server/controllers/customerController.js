import {
  addCustomer,
  getCustomers
} from "../services/customerService.js";


// =================== CREATE CUSTOMER ===================

export const create = async (req, res) => {
  try {

    const customer = await addCustomer(req.body);

    res.status(201).json({
      message: "Customer added successfully!",
      customer
    });

  } catch (error) {

    console.error("Error creating customer:", error);

    res.status(400).json({
      error: error.message
    });
  }
};


// =================== GET ALL CUSTOMERS ===================

export const getAll = async (req, res) => {
  try {

    const customers = await getCustomers();

    res.status(200).json(customers);

  } catch (error) {

    console.error("Error fetching customers:", error);

    res.status(500).json({
      error: "Failed to fetch customers"
    });
  }
};