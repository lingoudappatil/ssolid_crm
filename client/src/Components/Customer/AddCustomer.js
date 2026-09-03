import React, { useState } from "react";

const AddCustomerForm = ({ onCustomerAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    state: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const response = await fetch(`${base.replace(/\/$/, '')}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Customer added successfully!");
        setFormData({ name: '', email: '', phone: '', address: '', state: '' });
        if (onCustomerAdded) onCustomerAdded();
      } else {
        alert("Failed to add customer.");
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Error connecting to server.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
   <div className="add-form">
  <h2>Add Customer</h2>
  <form onSubmit={handleSubmit}>
    <div className="form-row">
      <div className="form-group">
        <label>Full Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Phone Number:</label>
        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Address:</label>
        <textarea name="address" value={formData.address} onChange={handleChange} rows="3" />
      </div>

      <div className="form-group">
        <label>State:</label>
        <input type="text" name="state" value={formData.state} onChange={handleChange} required />
      </div>
    </div>

    <button type="submit" className="submit-button">Add Customer</button>
  </form>
</div>


  );
};
export default AddCustomerForm;