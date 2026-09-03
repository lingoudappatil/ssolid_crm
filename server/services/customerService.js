import {
  createCustomer,
  getAllCustomers
} from "../repositories/customerRepository.js";


// =================== CREATE CUSTOMER ===================

export const addCustomer = async ({
  name,
  email,
  phone,
  address,
  state
}) => {

  // Validate required fields
  if (!name || !email || !phone || !address || !state) {
    throw new Error(
      "Name, email, phone, address, and state are required"
    );
  }

  return await createCustomer({
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    address: address.trim(),
    state: state.trim()
  });
};


// =================== GET CUSTOMERS ===================

export const getCustomers = async () => {
  return await getAllCustomers();
};