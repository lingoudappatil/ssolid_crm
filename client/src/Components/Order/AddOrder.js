import React, { useContext, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import "./Order.css";

const AddOrder = () => {
  const { moduleSettings: settings } = useSettings();

  const customFields = settings?.customFields?.Order || [];

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    ...Object.fromEntries(
      customFields.map((field) => [field.label, ""])
    ),
  });

  // SQL orders table supports ONE item per order
  const [item, setItem] = useState({
    itemName: "",
    qty: 1,
    unit: "",
    price: 0,
    discount: 0,
    tax: 0,
  });

  // ==========================================
  // CUSTOMER FIELD CHANGE
  // ==========================================
  const handleCustomerChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  // ==========================================
  // ITEM FIELD CHANGE
  // ==========================================
  const handleItemChange = (e) => {
    const { name, value } = e.target;

    setItem({
      ...item,
      [name]: value,
    });
  };


  // ==========================================
  // CALCULATE VALUES
  // ==========================================
  const quantity = Number(item.qty) || 0;
  const price = Number(item.price) || 0;
  const discountPercent = Number(item.discount) || 0;
  const tax = Number(item.tax) || 0;

  const subtotal = quantity * price;

  const discountAmount =
    (subtotal * discountPercent) / 100;

  const afterDiscount =
    subtotal - discountAmount;

  const taxAmount =
    (afterDiscount * tax) / 100;

  const totalAmount =
    afterDiscount + taxAmount;


  // ==========================================
  // SUBMIT ORDER
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ------------------------------------------
    // Validate customer
    // ------------------------------------------

    if (!formData.customerName?.trim()) {
      alert("❌ Customer name is required");
      return;
    }

    if (!formData.email?.trim()) {
      alert("❌ Email is required");
      return;
    }

    if (!formData.phone?.trim()) {
      alert("❌ Phone is required");
      return;
    }


    // ------------------------------------------
    // Validate item
    // ------------------------------------------

    if (!item.itemName?.trim()) {
      alert("❌ Item name is required");
      return;
    }

    if (quantity <= 0) {
      alert("❌ Quantity must be greater than 0");
      return;
    }

    if (price <= 0) {
      alert("❌ Price must be greater than 0");
      return;
    }

    if (tax < 0) {
      alert("❌ Tax cannot be negative");
      return;
    }

    if (
      discountPercent < 0 ||
      discountPercent > 100
    ) {
      alert("❌ Discount must be between 0 and 100");
      return;
    }


    try {

      // ----------------------------------------
      // Validate custom fields
      // ----------------------------------------

      const customFieldValues = {};

      customFields.forEach((field) => {
        customFieldValues[field.label] =
          formData[field.label];

        if (
          field.required &&
          !formData[field.label]
        ) {
          throw new Error(
            `${field.label} is required`
          );
        }
      });


      // ----------------------------------------
      // SQL backend payload
      // ----------------------------------------

      const payload = {
        name: formData.customerName.trim(),

        email: formData.email.trim(),

        phone: formData.phone.trim(),

        item: item.itemName.trim(),

        quantity: quantity,

        price: price,

        tax: tax,

        discountPercent: discountPercent,

        discountAmount: 0,
      };


      console.log(
        "📦 Sending order payload:",
        payload
      );


      // ----------------------------------------
      // API call
      // ----------------------------------------

      const base =
        process.env.REACT_APP_API_URL ||
        "http://localhost:5000";

      const res = await fetch(
        `${base.replace(/\/$/, "")}/api/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );


      const data = await res.json();


      // ----------------------------------------
      // Handle API error
      // ----------------------------------------

      if (!res.ok) {
        console.error(
          "❌ Server response:",
          data
        );

        throw new Error(
          data.error ||
          data.message ||
          "Failed to add order"
        );
      }


      console.log(
        "✅ Order created:",
        data
      );

      alert(
        "✅ Order added successfully!"
      );


      // ----------------------------------------
      // Reset form
      // ----------------------------------------

      setFormData({
        customerName: "",
        email: "",
        phone: "",
        address: "",
        state: "",
        ...Object.fromEntries(
          customFields.map((field) => [
            field.label,
            "",
          ])
        ),
      });

      setItem({
        itemName: "",
        qty: 1,
        unit: "",
        price: 0,
        discount: 0,
        tax: 0,
      });

    } catch (err) {

      console.error(
        "❌ Order error:",
        err
      );

      alert(
        `❌ Error: ${err.message}`
      );
    }
  };


  // ==========================================
  // CUSTOM FIELD RENDERING
  // ==========================================
  const renderCustomField = (field) => {

    const fieldProps = {
      name: field.label,
      value: formData[field.label] || "",
      onChange: handleCustomerChange,
      required: field.required,
      className:
        "border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
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


      case "dropdown": {

        const options = Array.isArray(
          field.options
        )
          ? field.options
          : typeof field.options === "string"
          ? field.options
              .split(",")
              .map((opt) => opt.trim())
          : [];

        return (
          <select {...fieldProps}>
            <option value="">
              Select {field.label}
            </option>

            {options.map(
              (opt, idx) => (
                <option
                  key={idx}
                  value={opt}
                >
                  {opt}
                </option>
              )
            )}
          </select>
        );
      }


      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={
              formData[field.label] ||
              false
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                [field.label]:
                  e.target.checked,
              })
            }
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


  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="add-form p-6">

      <form
        onSubmit={handleSubmit}
        className="max-w-6xl mx-auto"
      >

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          🧾 Add Order
        </h2>


        <div className="add-form-sections">

          {/* =====================================
              CUSTOMER INFORMATION
          ====================================== */}

          <div className="bg-white rounded-lg shadow-md p-6">

            <h3 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">
              👤 Customer Information
            </h3>


            <div className="form-row">

              <div className="form-group">

                <label>
                  Customer Name
                </label>

                <input
                  type="text"
                  name="customerName"
                  value={
                    formData.customerName
                  }
                  onChange={
                    handleCustomerChange
                  }
                  className="border p-2 w-full rounded-md"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleCustomerChange
                  }
                  className="border p-2 w-full rounded-md"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleCustomerChange
                  }
                  className="border p-2 w-full rounded-md"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={
                    formData.state
                  }
                  onChange={
                    handleCustomerChange
                  }
                  className="border p-2 w-full rounded-md"
                />

              </div>


              <div className="form-group">

                <label>
                  Address
                </label>

                <textarea
                  name="address"
                  value={
                    formData.address
                  }
                  onChange={
                    handleCustomerChange
                  }
                  className="border p-2 w-full rounded-md"
                  rows={3}
                />

              </div>

            </div>

          </div>


          {/* =====================================
              CUSTOM FIELDS
          ====================================== */}

          <div className="bg-white rounded-lg shadow-md p-6">

            <h3 className="text-lg font-semibold mb-4 text-green-800 border-b pb-2">
              🎨 Custom Fields{" "}
              {customFields.length === 0 &&
                "(None configured)"}
            </h3>


            <div className="form-row">

              {customFields.length === 0 ? (

                <div className="text-center text-gray-500 py-8">

                  <p>
                    No custom fields configured.
                  </p>

                  <p className="text-sm mt-2">
                    Add custom fields from the
                    Settings page.
                  </p>

                </div>

              ) : (

                customFields.map(
                  (field, index) => (

                    <div
                      key={index}
                      className="form-group"
                    >

                      <label className="block text-sm font-medium text-gray-700 mb-1">

                        {field.label}

                        {field.required && (
                          <span className="text-red-500 ml-1">
                            *
                          </span>
                        )}

                      </label>

                      {renderCustomField(
                        field
                      )}

                    </div>
                  )
                )
              )}

            </div>

          </div>

        </div>


        {/* =====================================
            ORDER ITEM
        ====================================== */}

        <div className="bg-white rounded-lg shadow-md p-6 mt-8">

          <h3 className="text-lg font-semibold mb-4 text-purple-800 border-b pb-2">
            📦 Order Item
          </h3>


          <table className="quotation-table w-full text-left border-collapse">

            <thead>

              <tr className="bg-gray-100 border-b">

                <th>
                  Item Name
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Unit
                </th>

                <th>
                  Price
                </th>

                <th>
                  Discount %
                </th>

                <th>
                  Tax %
                </th>

                <th>
                  Total
                </th>

              </tr>

            </thead>


            <tbody>

              <tr className="border-b">

                <td>

                  <input
                    type="text"
                    name="itemName"
                    value={
                      item.itemName
                    }
                    onChange={
                      handleItemChange
                    }
                    required
                  />

                </td>


                <td>

                  <input
                    type="number"
                    name="qty"
                    value={item.qty}
                    min="1"
                    onChange={
                      handleItemChange
                    }
                  />

                </td>


                <td>

                  <input
                    type="text"
                    name="unit"
                    value={item.unit}
                    onChange={
                      handleItemChange
                    }
                  />

                </td>


                <td>

                  <input
                    type="number"
                    name="price"
                    value={item.price}
                    min="0"
                    onChange={
                      handleItemChange
                    }
                  />

                </td>


                <td>

                  <input
                    type="number"
                    name="discount"
                    value={item.discount}
                    min="0"
                    max="100"
                    onChange={
                      handleItemChange
                    }
                  />

                </td>


                <td>

                  <input
                    type="number"
                    name="tax"
                    value={item.tax}
                    min="0"
                    onChange={
                      handleItemChange
                    }
                  />

                </td>


                <td>
                  ₹
                  {totalAmount.toFixed(2)}
                </td>

              </tr>

            </tbody>

          </table>


          <div className="mt-4 text-right">

            <div>
              Subtotal: ₹
              {subtotal.toFixed(2)}
            </div>

            <div>
              Discount: ₹
              {discountAmount.toFixed(2)}
            </div>

            <div>
              Tax: ₹
              {taxAmount.toFixed(2)}
            </div>

            <div className="font-semibold text-lg">
              Total: ₹
              {totalAmount.toFixed(2)}
            </div>

          </div>

        </div>


        {/* =====================================
            SAVE BUTTON
        ====================================== */}

        <div className="mt-8 text-center">

          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            Save Order
          </button>

        </div>

      </form>

    </div>
  );
};


export default AddOrder;