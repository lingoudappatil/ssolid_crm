// client/src/Components/Leads/ViewLeads.js
import React, { useEffect, useState } from "react";
import DateFilter from "./datefilter";
import "./ViewLeads.css";

const ViewLeads = ({ refreshTrigger, onEdit }) => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [openActionId, setOpenActionId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const perPage = 8;
    const leadSources = ["Friend", "Walk In", "Social Media", "Other"];


  const base = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // ✅ Fetch all leads
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/leads`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLeads(data);
      setFilteredLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initial + refresh trigger
  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".lead-dropdown-menu") && !e.target.closest("button")) {
        setOpenActionId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ Search filter
  useEffect(() => {
    const input = document.getElementById("global-search");
    const handler = (e) => setQuery(e.target.value);
    if (input) input.addEventListener("input", handler);
    return () => input && input.removeEventListener("input", handler);
  }, []);

  // ✅ Filter leads
  const visibleLeads = filteredLeads
    .filter((l) => JSON.stringify(l).toLowerCase().includes(query.toLowerCase()))
    .filter((l) => (filterStatus === "all" ? true : l.status === filterStatus));

  // ✅ Pagination
  const pageCount = Math.max(1, Math.ceil(visibleLeads.length / perPage));
  const pageData = visibleLeads.slice((page - 1) * perPage, page * perPage);

  // ✅ Date filter
  const handleDateFilter = (start, end) => {
    if (!start || !end) {
      setFilteredLeads(leads);
      return;
    }
    const filtered = leads.filter((item) => {
      const date = new Date(item.createdAt);
      return date >= start && date <= end;
    });
    setFilteredLeads(filtered);
    setPage(1);
  };

  // ✅ View Lead
  const handleView = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  // ✅ Toggle Actions menu with position calculation
  const handleActionsClick = (leadId, event) => {
    if (openActionId === leadId) {
      setOpenActionId(null);
      return;
    }

    // Get button position
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Position dropdown below the button, aligned to right edge
    setDropdownPos({
      top: rect.bottom + 5,
      left: rect.right - 150, // Align right (dropdown width ~150px)
    });

    setOpenActionId(leadId);
  };

  // ✅ Edit Lead - Open Modal
  const handleEdit = (lead) => {
    setEditFormData({ ...lead });
    setShowEditModal(true);
    setOpenActionId(null);
  };

  // ✅ Save Edit
  const handleSaveEdit = async () => {
    if (!editFormData) return;

    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/leads/${editFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          address: editFormData.address,
          state: editFormData.state,
          source: editFormData.source,
          status: editFormData.status,
          customFields: editFormData.customFields,
          followUps: editFormData.followUps,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      alert("Lead updated successfully!");
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error updating lead");
    }
  };

  // ✅ Delete Lead - Show confirmation modal
  const handleDelete = (id) => {
    setDeleteConfirmId(id);
    setShowDeleteModal(true);
    setOpenActionId(null);
  };

  // ✅ Confirm Delete
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/leads/${deleteConfirmId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      // Remove from state
      setLeads((prev) => prev.filter((l) => l.id !== deleteConfirmId));
      setFilteredLeads((prev) => prev.filter((l) => l.id !== deleteConfirmId));
      setShowDeleteModal(false);
      setDeleteConfirmId(null);
      alert("Lead deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting lead");
      setShowDeleteModal(false);
      setDeleteConfirmId(null);
    }
  };

  // ✅ Export Lead as JSON
  const handleExport = (lead) => {
    const dataStr = JSON.stringify(lead, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lead_${lead.id}_${lead.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setOpenActionId(null);
  };

  // ✅ Export Lead as PDF
  const handleExportPDF = async (lead) => {
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/leads/${lead.id}/export-pdf`, {
        method: "GET",
      });

      if (!res.ok) {
        // Fallback: generate simple PDF on client side
        generatePDFClient(lead);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lead_${lead.id}_${lead.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      alert("PDF exported successfully!");
    } catch (err) {
      console.error("PDF export error:", err);
      generatePDFClient(lead); // Fallback to client-side PDF
    }

    setOpenActionId(null);
  };

  // ✅ Client-side PDF generation (fallback)
  const generatePDFClient = (lead) => {
    // Simple HTML to PDF conversion
    const htmlContent = `
      <html>
        <head>
          <title>Lead Details - ${lead.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
          </style>
        </head>
        <body>
          <h1>Lead Details</h1>
          <div class="field"><span class="label">ID:</span> ${lead.id}</div>
          <div class="field"><span class="label">Name:</span> ${lead.name}</div>
          <div class="field"><span class="label">Email:</span> ${lead.email}</div>
          <div class="field"><span class="label">Phone:</span> ${lead.phone}</div>
          <div class="field"><span class="label">Address:</span> ${lead.address}</div>
          <div class="field"><span class="label">State:</span> ${lead.state}</div>
          <div class="field"><span class="label">Source:</span> ${lead.source}</div>
          <div class="field"><span class="label">Status:</span> ${lead.status}</div>
          <div class="field"><span class="label">Created:</span> ${new Date(lead.createdAt).toLocaleString()}</div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div>
      {/* 🔹 Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          background: "#f5f5f5",
          padding: "10px 15px",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: 0 }}>Leads</h3>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Status Filter */}
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

          {/* Date Filter */}
          <DateFilter onFilter={handleDateFilter} />

          {/* Refresh Button */}
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
        </div>
      </div>

      {/* 🔹 Leads Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Source</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No leads found.
                </td>
              </tr>
            )}
            {pageData.map((l, i) => (
              <tr key={l._id || i}>
                <td>{(page - 1) * perPage + i + 1}</td>
                <td>{l.name || "-"}</td>
                <td>{l.phone || "-"}</td>
                <td>{l.email || "-"}</td>
                <td>{l.source || "-"}</td>
                <td>{l.status || "New"}</td>
                <td>
                  {l.createdAt
                    ? new Date(l.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td style={{ position: "relative" }}>
                  <button
                    onClick={(e) => handleActionsClick(l.id, e)}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Actions ⬇️
                  </button>

                  {openActionId === l.id && (
                    <div
                      className="lead-dropdown-menu"
                      style={{
                        top: `${dropdownPos.top}px`,
                        left: `${dropdownPos.left}px`,
                      }}
                    >
                      <button onClick={() => { handleView(l); setOpenActionId(null); }} style={menuBtnStyle}>
                        👁️ View
                      </button>
                      <button onClick={() => handleEdit(l)} style={menuBtnStyle}>
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(l.id)}
                        style={{
                          ...menuBtnStyle,
                          color: "#dc3545",
                        }}
                      >
                        🗑️ Delete
                      </button>
                      <button onClick={() => handleExport(l)} style={menuBtnStyle}>
                        📄 Export JSON
                      </button>
                      <button onClick={() => handleExportPDF(l)} style={menuBtnStyle}>
                        📕 Export PDF
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(1)} disabled={page === 1}>
          First
        </button>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <span>
          Page {page} / {pageCount}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page === pageCount}
        >
          Next
        </button>
        <button
          onClick={() => setPage(pageCount)}
          disabled={page === pageCount}
        >
          Last
        </button>
      </div>

      {/* 🔹 View Lead Modal */}
      {showViewModal && selectedLead && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowViewModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Lead Details</h3>
            <div style={{ marginBottom: "10px" }}>
              <strong>Name:</strong> {selectedLead.name}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Email:</strong> {selectedLead.email}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Phone:</strong> {selectedLead.phone}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Address:</strong> {selectedLead.address}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>State:</strong> {selectedLead.state}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Source:</strong> {selectedLead.source}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Status:</strong> {selectedLead.status}
            </div>
            {selectedLead.customFields && Object.keys(selectedLead.customFields).length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Custom Fields:</strong>
                <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px" }}>
                  {JSON.stringify(selectedLead.customFields, null, 2)}
                </pre>
              </div>
            )}
            {selectedLead.followUps && selectedLead.followUps.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Follow-ups:</strong>
                <ul>
                  {selectedLead.followUps.map((fu, idx) => (
                    <li key={idx}>
                      {fu.date} at {fu.time}: {fu.remark}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setShowViewModal(false)}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 🔹 Edit Lead Modal */}
      {showEditModal && editFormData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    width: "500px",
    maxWidth: "90vw",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Edit Lead</h3>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Name:
              </label>
              <input
                type="text"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Email:
              </label>
              <input
                type="email"
                value={editFormData.email || ""}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Phone:
              </label>
              <input
                type="tel"
                value={editFormData.phone || ""}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Address:
              </label>
              <input
                type="text"
                value={editFormData.address || ""}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                State:
              </label>
              <input
                type="text"
                value={editFormData.state || ""}
                onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
<label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Source:
              </label>              <select
                  name="Source"
                  value={editFormData.Source}
                  onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Source Type</option>
                  {leadSources.map((src, i) => (
                    <option key={i} value={src}>{src}</option>
                  ))}
                </select>

            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Status:
              </label>
              <select
                value={editFormData.status || "New"}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              >
                <option value="New">New</option>
                <option value="Active">Active</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleSaveEdit}
                style={{
                  flex: 1,
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Delete Confirmation Modal */}
      {showDeleteModal && deleteConfirmId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "400px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, color: "#dc3545" }}>⚠️ Confirm Delete</h3>
            <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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

export default ViewLeads;
