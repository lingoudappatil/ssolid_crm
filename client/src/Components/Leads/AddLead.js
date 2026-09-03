//client/src/Components/Leads/AddLead.js
import React, { useContext, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
const AddLead = ({ onLeadAdded }) => {
  const leadSources = ["Friend", "Walk In", "Social Media", "Other"];
  const token = localStorage.getItem("token");
  const { moduleSettings: settings } = useSettings();
  const customFields = settings?.customFields?.Lead || [];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    Source: "",
    followUpDate: "",
    followUpTime: "",
    followUpRemark: "",
    ...Object.fromEntries(customFields.map(field => [field.label, ""]))
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Extract custom field values
    const customFieldValues = {};
    customFields.forEach(field => {
      customFieldValues[field.label] = formData[field.label];
    });

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      state: formData.state,
      Source: formData.Source,
      followUps: [
        {
          date: formData.followUpDate,
          time: formData.followUpTime || "00:00",
          remark: formData.followUpRemark,
        },
      ],
      customFields: customFieldValues // Add custom fields to payload
    };

    try {
      const base = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await fetch(`${base}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" 
          , "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add lead");
      alert("✅ Lead added successfully!");
      
      // Reset form including custom fields
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        state: "",
        Source: "",
        followUpDate: "",
        followUpTime: "",
        followUpRemark: "",
        ...Object.fromEntries(customFields.map(field => [field.label, ""]))
      });
      
      if (onLeadAdded) onLeadAdded();
    } catch (error) {
      alert(`❌ ${error.message}`);
    }
  };

  const renderCustomField = (field) => {
    const fieldProps = {
      name: field.label,
      value: formData[field.label] || "",
      onChange: handleChange,
      required: field.required,
      className: "border p-2 w-full mb-4"
    };

    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <input
            type={field.type}
            {...fieldProps}
          />
        );
      case "textarea":
        return (
          <textarea
            {...fieldProps}
          />
        );
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
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={formData[field.label] || false}
            {...fieldProps}
          />
        );
      case "date":
        return (
          <input
            type="date"
            {...fieldProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="add-form p-6">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">➕ Add Lead</h2>

        <div className="add-form-sections">
          {/* Fixed Fields Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">
              📋 Basic Information
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  name="Source"
                  value={formData.Source}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Source Type</option>
                  {leadSources.map((src, i) => (
                    <option key={i} value={src}>{src}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Date</label>
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Time</label>
                <input
                  type="time"
                  name="followUpTime"
                  value={formData.followUpTime}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Remark</label>
                <input
                  type="text"
                  name="followUpRemark"
                  value={formData.followUpRemark}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-800 border-b pb-2">
              🎨 Custom Fields {customFields.length === 0 && '(None configured)'}
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

        <div className="mt-8 text-center">
          <button 
            type="submit" 
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            Save Lead
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLead;