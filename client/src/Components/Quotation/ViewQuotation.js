// client/src/Components/Quotation/ViewQuotation.js
import React, { useEffect, useState } from "react";
import DateFilter from "./datefilter";
import filter from "./filter";
import "./quotation.css";

const ViewQuotations = ({ onRefreshParent }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [page, setPage] = useState(1);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const perPage = 10;

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [openActionId, setOpenActionId] = useState(null);

  // Fetch quotations
  const fetchData = async () => {
    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const res = await fetch(`${base.replace(/\/$/, "")}/api/quotations`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setQuotes(data);
      setFilteredQuotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Global search input listener
  useEffect(() => {
    const input = document.getElementById("global-search");
    const handler = (e) => setQuery(e.target.value);
    if (input) input.addEventListener("input", handler);
    return () => input && input.removeEventListener("input", handler);
  }, []);

  // Date filter handler
  const handleDateFilter = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Apply filters
  useEffect(() => {
    let result = [...quotes];

    if (filterStatus !== "all") {
      result = result.filter((q) => q.status === filterStatus);
    }

    if (query) {
      result = result.filter((q) =>
        JSON.stringify(q).toLowerCase().includes(query.toLowerCase())
      );
    }

    if (startDate && endDate) {
      result = result.filter((q) => {
        const date = new Date(q.createdAt);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }

    setFilteredQuotes(result);
    setPage(1);
  }, [filterStatus, query, startDate, endDate, quotes]);

  // Pagination logic
  const pageCount = Math.max(1, Math.ceil(filteredQuotes.length / perPage));
  const pageData = filteredQuotes.slice((page - 1) * perPage, page * perPage);

  // Actions
  const handleView = (quote) => {
    setSelectedQuote(quote);
    setViewModalOpen(true);
  };

  const handleEdit = (quote) => {
    setSelectedQuote({ ...quote });
    setEditModalOpen(true);
  };

  const handleUpdateQuote = async (e) => {
    e.preventDefault();
    try {
      const base = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await fetch(`${base.replace(/\/$/, "")}/api/quotations/${selectedQuote._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedQuote.customerName,
          email: selectedQuote.email,
          phone: selectedQuote.phone,
          item: selectedQuote.item,
          quantity: selectedQuote.quantity,
          amount: selectedQuote.amount,
          address: selectedQuote.address,
          state: selectedQuote.state
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update quotation");
      }

      setEditModalOpen(false);
      fetchData();
      alert("✅ Quotation updated successfully!");
    } catch (error) {
      console.error("Error updating quotation:", error);
      alert(`❌ ${error.message || "Failed to update quotation"}`);
    }
  };

  const handleExportPDF = async (quote) => {
    try {
      const base = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const res = await fetch(`${base.replace(/\/$/, "")}/api/quotations/${quote._id}/export`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "PDF export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation-${quote.quotationNumber || quote._id}.pdf`;

      // Append to body, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Cleanup
      window.URL.revokeObjectURL(url);

      alert("✅ PDF exported successfully!");
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert(`❌ ${err.message || "Failed to export PDF."}`);
    }
  };

  // View Modal
  const ViewModal = () =>
    viewModalOpen && selectedQuote && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Quotation Details</h2>
          <p><b>Quote No:</b> {selectedQuote.quoteNumber || selectedQuote._id}</p>
          <p><b>Customer:</b> {selectedQuote.customerName || selectedQuote.customerName}</p>
          <p><b>Email:</b> {selectedQuote.email}</p>
          <p><b>Phone:</b> {selectedQuote.phone}</p>
          <p><b>Item:</b> {selectedQuote.item}</p>
          <p><b>Quantity:</b> {selectedQuote.quantity}</p>
          <p><b>Amount:</b> ₹{selectedQuote.amount}</p>
          <p><b>Status:</b> {selectedQuote.status}</p>
          <p><b>Date:</b> {new Date(selectedQuote.createdAt).toLocaleString()}</p>
          <div className="modal-actions">
            <button onClick={() => setViewModalOpen(false)} className="cancel-btn">Close</button>
          </div>
        </div>
      </div>
    );

  // Edit Modal
  const EditModal = () =>
    editModalOpen && selectedQuote && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Edit Quotation</h2>
          <form onSubmit={handleUpdateQuote}>
            <div className="form-group">
              <label>Customer Name:</label>
              <input
                type="text"
                value={selectedQuote.name}
                onChange={(e) => setSelectedQuote({ ...selectedQuote, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Item:</label>
              <input
                type="text"
                value={selectedQuote.item}
                onChange={(e) => setSelectedQuote({ ...selectedQuote, item: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Quantity:</label>
              <input
                type="number"
                value={selectedQuote.quantity}
                onChange={(e) => setSelectedQuote({ ...selectedQuote, quantity: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Amount:</label>
              <input
                type="number"
                value={selectedQuote.amount}
                onChange={(e) => setSelectedQuote({ ...selectedQuote, amount: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button type="submit" className="save-btn">Save Changes</button>
              <button type="button" onClick={() => setEditModalOpen(false)} className="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );

  return (
    <div className="quotation-container">
      {/* Header */}
      <div className="header-bar" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option value="all">All</option>
            <option value="New">New</option>
            <option value="Active">Active</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>

          <DateFilter onFilter={handleDateFilter} />

          <button
            onClick={fetchData}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            🔄 Refresh
          </button>
            <button onclick = "filter">
            🔄 Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
  <table className="data-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Quotation No.</th>
        <th>Customer Name</th>
        <th>Total Amount (₹)</th>
        <th>Status</th>
        <th>Date</th>

        {/* ✅ Dynamically render custom field headers */}
        {quotes.length > 0 && quotes[0].customFields &&
          Object.keys(quotes[0].customFields).map((fieldKey) => (
            <th key={fieldKey}>{fieldKey}</th>
          ))
        }

        <th>Actions</th>
      </tr>
    </thead>

    <tbody>
  {loading ? (
    <tr><td colSpan="7" style={{ textAlign: "center" }}>Loading...</td></tr>
  ) : pageData.length === 0 ? (
    <tr><td colSpan="7" style={{ textAlign: "center" }}>No quotations found.</td></tr>
  ) : (
    pageData.map((q, i) => (
      <tr key={q.quotationId || i}>
        <td>{(page - 1) * perPage + i + 1}</td>
        <td>{q.quoteNumber || q.ref || q.quotationId}</td>
        <td>{q.customerName || "-"}</td>
        <td>{q.totalAmount || q.amount || "-"}</td>
        <td>{q.status || "-"}</td>
        <td>{q.createdAt ? new Date(q.createdAt).toLocaleString() : "-"}</td>
        <td style={{ position: "relative" }}>
          <button
            onClick={() => setOpenActionId(openActionId === q.quotationId ? null : q.quotationId)}
            style={{
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            Actions ⬇️
          </button>

          {openActionId === q.quotationId && (
            <div className="dropdown-menu">
              <button onClick={() => handleView(q)} style={menuBtnStyle}>👁 View</button>
              <button onClick={() => handleEdit(q)} style={menuBtnStyle}>✏️ Edit</button>
              <button onClick={() => handleExportPDF(q)} style={menuBtnStyle}>📄 Export PDF</button>
            </div>
          )}
        </td>
      </tr>
    ))
  )}
</tbody>

  </table>
</div>


      {/* Pagination */}
      <div className="pagination" style={{ marginTop: "15px", textAlign: "center" }}>
        <button onClick={() => setPage(1)} disabled={page === 1}>First</button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
        <span style={{ margin: "0 10px" }}>Page {page} / {pageCount}</span>
        <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next</button>
        <button onClick={() => setPage(pageCount)} disabled={page === pageCount}>Last</button>
      </div>

      {/* Render Modals */}
      {ViewModal()}
      {EditModal()}
    </div>
  );
};

const menuBtnStyle = {
  display: "block",
  width: "100%",
  background: "none",
  border: "none",
  padding: "8px 12px",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "14px",
};

export default ViewQuotations;
