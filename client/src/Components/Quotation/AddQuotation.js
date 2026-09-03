import React, { useContext, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import "./quotation.css";

const AddQuotation = () => {
  const { moduleSettings: settings } = useSettings();
  const customFields = settings?.customFields?.Quotation || [];

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    ...Object.fromEntries(customFields.map(field => [field.label, ""]))
  });

  const [items, setItems] = useState([
    { itemName: "", qty: 1, unit: "", price: 0, discount: 0, tax: 0, subtotal: 0 },
  ]);

  const handleCustomerChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...items];
    updatedItems[index][name] = value;

    const price = parseFloat(updatedItems[index].price) || 0;
    const qty = parseFloat(updatedItems[index].qty) || 0;
    const discount = parseFloat(updatedItems[index].discount) || 0;
    const tax = parseFloat(updatedItems[index].tax) || 0;

    const amount = price * qty;
    const discounted = amount - (amount * discount) / 100;
    const taxed = discounted + (discounted * tax) / 100;

    updatedItems[index].subtotal = taxed.toFixed(2);
    setItems(updatedItems);
  };

  const addRow = () => {
    setItems([...items, { itemName: "", qty: 1, unit: "", price: 0, discount: 0, tax: 0, subtotal: 0 }]);
  };

  const removeRow = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const totalAmount = items.reduce((acc, item) => acc + parseFloat(item.subtotal || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate customer name
    if (!formData.customerName?.trim()) {
      alert("❌ Customer name is required");
      return;
    }

    // Validate items
    if (!items.length || !items.some(item => item.itemName?.trim() && item.qty > 0 && item.price > 0)) {
      alert("❌ At least one item with name, quantity, and price is required");
      return;
    }

    try {
      // Prepare custom fields
      const customFieldValues = {};
      customFields.forEach(field => {
        customFieldValues[field.label] = formData[field.label];
        // Validate required custom fields
        if (field.required && !formData[field.label]) {
          throw new Error(`${field.label} is required`);
        }
      });

      // Validate and clean items data
      const cleanItems = items.map(item => {
        const qty = parseFloat(item.qty);
        const price = parseFloat(item.price);
        const discount = parseFloat(item.discount) || 0;
        const tax = parseFloat(item.tax) || 0;
        
        // Calculate subtotal properly
        const baseAmount = qty * price;
        const discountAmount = baseAmount * (discount / 100);
        const afterDiscount = baseAmount - discountAmount;
        const taxAmount = afterDiscount * (tax / 100);
        const subtotal = afterDiscount + taxAmount;

        return {
    itemName: item.itemName?.trim(),
qty,
 price,
 qty: Number(qty),
 price: Number(price),
    unit: item.unit?.trim(),
    discount,
    tax,
    subtotal: Number(subtotal.toFixed(2)),
        };
      });

      const payload = {
        customerName: formData.customerName?.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
        address: formData.address?.trim(),
        state: formData.state?.trim(),
        items: cleanItems,
        totalAmount: Number(totalAmount),  // ensure numeric
        customFields: customFieldValues,
        date: new Date().toISOString() // Add creation date
      };

      // Debug log
      console.log("Sending quotation payload:", payload);

      const base = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const res = await fetch(`${base.replace(/\/$/, "")}/api/quotations`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        console.error("Server response:", data);
        throw new Error(data.error || data.message || "Failed to add quotation");
      }

      alert("✅ Quotation added successfully!");
      
      // Reset form
      setFormData({
        customerName: "",
        email: "",
        phone: "",
        address: "",
        state: "",
        ...Object.fromEntries(customFields.map(field => [field.label, ""]))
      });
      setItems([{ itemName: "", qty: 1, unit: "", price: 0, discount: 0, tax: 0, subtotal: 0 }]);
    } catch (err) {
      console.error("Quotation error:", err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  const renderCustomField = (field) => {
    const fieldProps = {
      name: field.label,
      value: formData[field.label] || "",
      onChange: handleCustomerChange,
      required: field.required,
      className: "border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    };

    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return <input type={field.type} {...fieldProps} />;
      case "textarea":
        return <textarea {...fieldProps} />;
      case "dropdown":
        const options = Array.isArray(field.options)
          ? field.options
          : typeof field.options === "string"
            ? field.options.split(",").map(opt => opt.trim())
            : [];
        return (
          <select {...fieldProps}>
            <option value="">Select {field.label}</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={formData[field.label] || false}
            onChange={(e) =>
              setFormData({ ...formData, [field.label]: e.target.checked })
            }
          />
        );
      case "date":
        return <input type="date" {...fieldProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="add-form p-6">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">🧾 Add Quotations</h2>

        <div className="add-form-sections">
          {/* ================= Customer Info ================= */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">
              👤 Customer Information
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleCustomerChange}
                  className="border p-2 w-full rounded-md"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleCustomerChange}
                  className="border p-2 w-full rounded-md"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleCustomerChange}
                  className="border p-2 w-full rounded-md"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleCustomerChange}
                  className="border p-2 w-full rounded-md"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleCustomerChange}
                  className="border p-2 w-full rounded-md"
                  rows={3}
                />
              </div>
            </div>
          </div>
          {/* ================= Custom Fields ================= */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-800 border-b pb-2">
              🎨 Custom Fields {customFields.length === 0 && "(None configured)"}
            </h3>

            <div className="form-row">
              {customFields.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No custom fields configured.</p>
                  <p className="text-sm mt-2">Add custom fields from the Settings page.</p>
                </div>
              ) : (
                customFields.map((field, index) => (
                  <div key={index} className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= Items Section ================= */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4 text-purple-800 border-b pb-2">
            📦 Quotation Items
          </h3>

          <table className="quotation-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th>Sr. No</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Discount %</th>
                <th>Tax %</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td>{index + 1}</td>
                  <td><input type="text" name="itemName" value={item.itemName} onChange={(e) => handleItemChange(index, e)} required /></td>
                  <td><input type="number" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} /></td>
                  <td><input type="text" name="unit" value={item.unit} onChange={(e) => handleItemChange(index, e)} /></td>
                  <td><input type="number" name="price" value={item.price} onChange={(e) => handleItemChange(index, e)} /></td>
                  <td><input type="number" name="discount" value={item.discount} onChange={(e) => handleItemChange(index, e)} /></td>
                  <td><input type="number" name="tax" value={item.tax} onChange={(e) => handleItemChange(index, e)} /></td>
                  <td>{item.subtotal}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-red-600 hover:underline"
                      disabled={items.length === 1}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4" onClick={addRow}>
            ➕ Add Item
          </button>

          <div className="mt-4 text-right font-semibold text-lg">
            Total: ₹{totalAmount.toFixed(2)}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            Save Quotation
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuotation;
