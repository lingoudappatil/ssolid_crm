// client/src/Components/Leads/ViewLeads.js
import React, { useCallback, useEffect, useRef, useState } from "react";
import DateFilter from "./datefilter";
import Papa from "papaparse";
import "./ViewLeads.css";

const allowedStatusTransitions = {
  NEW: ["ASSIGNED", "CONTACTED", "QUALIFIED", "NURTURING", "LOST"],
  ASSIGNED: ["CONTACTED", "QUALIFIED", "NURTURING", "LOST"],
  CONTACTED: ["QUALIFIED", "NURTURING", "CONVERTED", "LOST"],
  QUALIFIED: ["NURTURING", "CONVERTED", "LOST"],
  NURTURING: ["CONTACTED", "QUALIFIED", "CONVERTED", "LOST"],
  CONVERTED: [],
  LOST: ["CONTACTED", "QUALIFIED", "NURTURING"]
};

const normalizeCode = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const getStatusLabel = (lead) => {
  const validLabel = (value) => {
    if (typeof value !== "string") return "";
    const label = value.trim();
    if (!label || /^(null|undefined|\[object object\])$/i.test(label)) {
      return "";
    }
    return label;
  };

  const statusName = validLabel(lead.statusName);
  if (statusName) return statusName;

  const legacyStatus = validLabel(lead.status);
  if (legacyStatus) return legacyStatus;

  const statusCode = validLabel(lead.statusCode);
  if (!statusCode) return "Unknown status";

  return statusCode
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ") || "Unknown status";
};

const findMasterId = (records, preferredId, ...labels) => {
  if (preferredId !== null && preferredId !== undefined && preferredId !== "") {
    const matchingId = records.find(
      (record) => String(record.id) === String(preferredId)
    );
    return matchingId ? String(matchingId.id) : "";
  }

  const normalizedLabels = labels
    .filter((label) => typeof label === "string" && label.trim())
    .map((label) => label.trim().toLowerCase());
  if (!normalizedLabels.length) return "";

  const matches = records.filter((record) =>
    normalizedLabels.some(
      (label) =>
        label === String(record.code || "").trim().toLowerCase() ||
        label === String(record.name || "").trim().toLowerCase()
    )
  );

  return matches.length === 1 ? String(matches[0].id) : "";
};

const ViewLeads = ({ refreshTrigger, onEdit }) => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [leadActionError, setLeadActionError] = useState("");
  const [leadActionMessage, setLeadActionMessage] = useState("");
  const [archivingLeadId, setArchivingLeadId] = useState(null);
  const [restoringLeadId, setRestoringLeadId] = useState(null);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [lostReasons, setLostReasons] = useState([]);
  const [loadingEditMasters, setLoadingEditMasters] = useState(false);
  const [editMastersError, setEditMastersError] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editingCurrentStatusCode, setEditingCurrentStatusCode] = useState("");
  const [editingCurrentStatusOption, setEditingCurrentStatusOption] = useState(null);
  const [openActionId, setOpenActionId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const perPage = 8;
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const base = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const loadEditMasterData = useCallback(async () => {
    setLoadingEditMasters(true);
    setEditMastersError("");

    try {
      const apiBase = base.replace(/\/$/, "");
      const endpoints = ["statuses", "sources", "lost-reasons"];
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`${apiBase}/api/lead-masters/${endpoint}`)
        )
      );
      const results = await Promise.all(
        responses.map(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to load Lead master data");
          }
          if (!Array.isArray(data)) {
            throw new Error("The server returned invalid Lead master data");
          }
          return data;
        })
      );

      setLeadStatuses(results[0]);
      setLeadSources(results[1]);
      setLostReasons(results[2]);
      return {
        statuses: results[0],
        sources: results[1],
        reasons: results[2]
      };
    } catch (error) {
      console.error("Lead edit master data error:", error);
      setEditMastersError(error.message || "Failed to load Lead master data");
      throw error;
    } finally {
      setLoadingEditMasters(false);
    }
  }, [base]);

  const getImportErrorMessage = (data, fallback) => {
    if (!data) return fallback;
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
    if (typeof data.details === "string") return data.details;
    if (Array.isArray(data.details)) {
      return data.details
        .map((detail) => detail.reason || detail.message || String(detail))
        .join("; ");
    }
    return fallback;
  };

  const normalizeImportResult = (data, totalFallback) => {
    const errors = Array.isArray(data?.errors)
      ? data.errors
      : Array.isArray(data?.failedRows)
        ? data.failedRows
        : Array.isArray(data?.errorDetails)
          ? data.errorDetails
          : [];

    const total = Number(data?.total ?? totalFallback ?? 0);
    const inserted = Number(
      data?.inserted ?? data?.imported ?? data?.successCount ?? 0
    );
    const failed = Number(
      data?.failed ?? data?.failedCount ?? errors.length
    );

    return {
      total: Number.isFinite(total) ? total : 0,
      inserted: Number.isFinite(inserted) ? inserted : 0,
      failed: Number.isFinite(failed) ? failed : errors.length,
      errors: errors.map((error) => ({
        row: error.row ?? error.rowNumber ?? error.line ?? "-",
        name: error.name ?? error.leadName ?? error.lead?.name ?? "",
        reason: error.reason ?? error.message ?? error.error ?? "Import failed"
      }))
    };
  };

  // =================== BULK CSV IMPORT ===================

  const handleFileImport = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Only CSV files are allowed
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("❌ Please select a CSV file only.");
      event.target.value = "";
      return;
    }

    setImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/^\uFEFF/, ""),

      complete: async (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            const parseMessage = results.errors
              .map((parseError) => parseError.message)
              .join("; ");
            throw new Error(parseMessage || "CSV parsing failed");
          }

          const rows = results.data || [];

          if (rows.length === 0) {
            throw new Error("The CSV file is empty.");
          }

          // Convert CSV values into the backend format
          const leadsToImport = rows.map((row) => ({
            name: row.name?.trim() || "",
            email: row.email?.trim() || "",
            phone: row.phone?.trim() || "",
            address: row.address?.trim() || "",
            state: row.state?.trim() || "",
            source: row.source?.trim() || "",
            status: row.status?.trim() || "New",
            customFields: {}
          }));

          const token = localStorage.getItem("token");

          const response = await fetch(
            `${base.replace(/\/$/, "")}/api/leads/bulk-import`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token
                  ? { Authorization: `Bearer ${token}` }
                  : {})
              },
              body: JSON.stringify({
                leads: leadsToImport
              })
            }
          );

          let data = {};
          try {
            data = await response.json();
          } catch {
            throw new Error(`Server returned HTTP ${response.status}.`);
          }

          if (!response.ok) {
            throw new Error(
              getImportErrorMessage(
                data,
                response.status === 401 || response.status === 403
                  ? "You are not authorized to import leads."
                  : `Bulk import failed (HTTP ${response.status}).`
              )
            );
          }

          setImportResult(normalizeImportResult(data, rows.length));

          // Refresh after storing the result so it cannot hide the report.
          await fetchData();

        } catch (error) {
          console.error("CSV import error:", error);
          alert(`❌ ${error.message}`);
        } finally {
          setImporting(false);

          // Reset file input so the same file can be selected again
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },

      error: (error) => {
        console.error("CSV parsing failed:", error);
        alert(`❌ ${error.message || "Failed to read the CSV file."}`);
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  // =================== DOWNLOAD CSV TEMPLATE ===================

  const handleDownloadTemplate = () => {
    const headers = [
      "name",
      "email",
      "phone",
      "address",
      "state",
      "source",
      "status"
    ];

    const exampleRow = [
      "Rahul Patil",
      "rahul@example.com",
      "9876543210",
      "Bangalore",
      "Karnataka",
      "Friend",
      "New"
    ];

    const csvContent = [
      headers.join(","),
      exampleRow.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "leads_import_template.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ✅ Fetch active or archived leads
  const fetchData = useCallback(async (archived = showArchived) => {
    setLoading(true);
    setLeadActionError("");
    try {
      const endpoint = archived ? "/api/leads/archived" : "/api/leads";
      const res = await fetch(`${base.replace(/\/$/, "")}${endpoint}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch leads");
      }
      if (!Array.isArray(data)) {
        throw new Error("The server returned an invalid lead list");
      }
      setLeads(data);
      setFilteredLeads(data);
    } catch (err) {
      console.error(err);
      setLeads([]);
      setFilteredLeads([]);
      setLeadActionError(err.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [base, showArchived]);

  // ✅ Initial + refresh trigger
  useEffect(() => {
    fetchData(showArchived);
  }, [fetchData, refreshTrigger, showArchived]);

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
  const currentStatusOption =
    editingCurrentStatusOption &&
    !leadStatuses.some(
      (status) => String(status.id) === String(editingCurrentStatusOption.id)
    )
      ? [editingCurrentStatusOption]
      : [];
  const editStatusOptions = [...leadStatuses, ...currentStatusOption].filter(
    (status) =>
      String(status.id) === String(editFormData?.statusId) ||
      normalizeCode(status.code) === editingCurrentStatusCode ||
      (allowedStatusTransitions[editingCurrentStatusCode] || []).includes(
        normalizeCode(status.code)
      )
  );
  const selectedStatusForEdit = editFormData
    ? leadStatuses.find(
        (status) => String(status.id) === String(editFormData.statusId)
      ) ||
      (String(editingCurrentStatusOption?.id) === String(editFormData.statusId)
        ? editingCurrentStatusOption
        : null)
    : null;

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
  const handleEdit = async (lead) => {
    if (showArchived || loadingEditMasters) return;
    setEditError("");
    setEditFormData({
      ...lead,
      sourceId: "",
      statusId: "",
      lostReasonId: null
    });
    setEditingCurrentStatusCode("");
    setEditingCurrentStatusOption(null);
    setShowEditModal(true);
    setOpenActionId(null);

    let masterData;
    try {
      masterData = await loadEditMasterData();
    } catch {
      return;
    }

    const { statuses, sources, reasons } = masterData;
    const statusForLead =
      statuses.find(
        (status) => String(status.id) === String(lead.statusId)
      ) ||
      statuses.find(
        (status) =>
          normalizeCode(status.code) === normalizeCode(lead.statusCode)
      );
    const currentStatusCode =
      normalizeCode(lead.statusCode) ||
      normalizeCode(statusForLead?.code) ||
      (lead.statusId === null || lead.statusId === undefined
        ? normalizeCode(
            statuses.find(
              (status) =>
                String(status.name).trim().toLowerCase() ===
                String(lead.statusName || lead.status || "")
                  .trim()
                  .toLowerCase()
            )?.code
          )
        : "");
    const statusId = findMasterId(
      statuses,
      lead.statusId,
      ...(lead.statusId === null || lead.statusId === undefined
        ? [lead.statusCode, lead.statusName, lead.status]
        : [])
    );
    const sourceId = findMasterId(
      sources,
      lead.sourceId,
      ...(lead.sourceId === null || lead.sourceId === undefined
        ? [lead.sourceCode, lead.sourceName, lead.source]
        : [])
    );
    const lostReasonId = findMasterId(
      reasons,
      lead.lostReasonId,
      ...(lead.lostReasonId === null || lead.lostReasonId === undefined
        ? [lead.lostReasonCode, lead.lostReasonName]
        : [])
    );
    const currentStatus =
      statuses.find((status) => String(status.id) === statusId) ||
      (lead.statusId !== null && lead.statusId !== undefined
        ? {
            id: lead.statusId,
            code: currentStatusCode,
            name: lead.statusName || lead.status || currentStatusCode
          }
        : null);

    setEditingCurrentStatusCode(currentStatusCode);
    setEditingCurrentStatusOption(currentStatus);
    setEditError("");
    setEditFormData({
      ...lead,
      sourceId,
      statusId,
      lostReasonId: lostReasonId || null
    });
  };

  // ✅ Save Edit
  const handleSaveEdit = async () => {
    if (!editFormData) return;
    if (loadingEditMasters) return;
    if (editMastersError) {
      setEditError(editMastersError);
      return;
    }
    if (!editFormData.sourceId) {
      setEditError("Select a valid lead source.");
      return;
    }
    if (!editFormData.statusId) {
      setEditError("Select a valid lead status.");
      return;
    }
    const selectedStatus = leadStatuses.find(
      (status) => String(status.id) === String(editFormData.statusId)
    ) || editingCurrentStatusOption;
    if (!selectedStatus) {
      setEditError("Unable to identify the selected lead status.");
      return;
    }
    if (normalizeCode(selectedStatus.code) === "LOST" && !editFormData.lostReasonId) {
      setEditError("Select a lost reason before saving a LOST lead.");
      return;
    }

    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/leads/${editFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          firstName: editFormData.firstName || null,
          lastName: editFormData.lastName || null,
          companyName: editFormData.companyName || null,
          jobTitle: editFormData.jobTitle || null,
          email: editFormData.email,
          phone: editFormData.phone,
          alternatePhone: editFormData.alternatePhone || null,
          address: editFormData.address,
          state: editFormData.state,
          sourceId: editFormData.sourceId,
          statusId: editFormData.statusId,
          ownerId: editFormData.ownerId || null,
          rating: editFormData.rating || null,
          score: editFormData.score ?? null,
          expectedValue: editFormData.expectedValue ?? null,
          nextFollowUpAt: editFormData.nextFollowUpAt || null,
          lastContactedAt: editFormData.lastContactedAt || null,
          convertedAt: editFormData.convertedAt || null,
          lostReasonId:
            normalizeCode(selectedStatus.code) === "LOST"
              ? editFormData.lostReasonId
              : null,
          customFields: editFormData.customFields || {},
          followUps: Array.isArray(editFormData.followUps)
            ? editFormData.followUps.map((followUp) => ({
                ...followUp,
                date:
                  typeof followUp.date === "string"
                    ? followUp.date.slice(0, 10)
                    : followUp.date instanceof Date
                      ? [
                          followUp.date.getFullYear(),
                          String(followUp.date.getMonth() + 1).padStart(2, "0"),
                          String(followUp.date.getDate()).padStart(2, "0")
                        ].join("-")
                      : followUp.date
              }))
            : []
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Update failed (HTTP ${res.status})`);
      }

      alert("Lead updated successfully!");
      setShowEditModal(false);
      setEditFormData(null);
      await fetchData(false);
    } catch (err) {
      console.error(err);
      setEditError(err.message || "Error updating lead");
    } finally {
      setEditSaving(false);
    }
  };

  // ✅ Delete Lead - Show confirmation modal
  const handleDelete = (id) => {
    if (archivingLeadId !== null) return;
    setLeadActionError("");
    setDeleteConfirmId(id);
    setShowDeleteModal(true);
    setOpenActionId(null);
  };

  // ✅ Confirm Delete
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setArchivingLeadId(deleteConfirmId);
    setLeadActionError("");
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/leads/${deleteConfirmId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to archive lead");

      setShowDeleteModal(false);
      setDeleteConfirmId(null);
      setLeadActionMessage(
        data.lead?.message || data.message || "Lead archived successfully"
      );
      setPage(1);
      await fetchData(false);
    } catch (err) {
      console.error(err);
      setLeadActionError(err.message || "Error archiving lead");
    } finally {
      setArchivingLeadId(null);
    }
  };

  const handleRestore = async (lead) => {
    if (restoringLeadId !== null) return;

    setRestoringLeadId(lead.id);
    setLeadActionError("");
    try {
      const res = await fetch(
        `${base.replace(/\/$/, "")}/api/leads/${lead.id}/restore`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore lead");

      setLeadActionMessage(data.message || "Lead restored successfully");
      setPage(1);
      await fetchData(true);
    } catch (err) {
      console.error(err);
      setLeadActionError(err.message || "Error restoring lead");
    } finally {
      setRestoringLeadId(null);
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
        <h3 style={{ margin: 0 }}>
          {showArchived ? "Archived Leads" : "Leads"}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => {
              setPage(1);
              setLeadActionError("");
              setLeadActionMessage("");
              setShowArchived((current) => !current);
            }}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            {showArchived ? "Active Leads" : "Archived Leads"}
          </button>

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

          {!showArchived && (
            <>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileImport}
                style={{ display: "none" }}
              />
              <button
                onClick={handleDownloadTemplate}
                style={{
                  backgroundColor: "#6f42c1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                📄 Template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                style={{
                  backgroundColor: importing ? "#6c757d" : "#198754",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: importing ? "not-allowed" : "pointer",
                }}
              >
                {importing ? "⏳ Importing..." : "📥 Import CSV"}
              </button>
            </>
          )}


          {/* Refresh Button */}
          <button
            onClick={() => fetchData()}
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

      {leadActionError && (
        <div role="alert" style={{ color: "#842029", marginBottom: "10px" }}>
          {leadActionError}
        </div>
      )}
      {leadActionMessage && (
        <div role="status" style={{ color: "#146c43", marginBottom: "10px" }}>
          {leadActionMessage}
        </div>
      )}

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
            {loading && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  Loading {showArchived ? "archived " : ""}leads...
                </td>
              </tr>
            )}
            {!loading && !leadActionError && pageData.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  {showArchived ? "No archived leads found." : "No leads found."}
                </td>
              </tr>
            )}
            {!loading && pageData.map((l, i) => (
              <tr key={l._id || i}>
                <td>{(page - 1) * perPage + i + 1}</td>
                <td>{l.name || "-"}</td>
                <td>{l.phone || "-"}</td>
                <td>{l.email || "-"}</td>
                <td>{l.source || "-"}</td>
                <td>{getStatusLabel(l)}</td>
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
                      {!showArchived && (
                        <>
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
                            📦 Archive
                          </button>
                        </>
                      )}
                      {showArchived && (
                        <button
                          onClick={() => handleRestore(l)}
                          disabled={restoringLeadId === l.id}
                          style={{
                            ...menuBtnStyle,
                            color: "#198754",
                            opacity: restoringLeadId === l.id ? 0.6 : 1,
                          }}
                        >
                          {restoringLeadId === l.id ? "Restoring..." : "↩️ Restore"}
                        </button>
                      )}
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
            {loadingEditMasters && (
              <p role="status">Loading Lead statuses, sources, and lost reasons...</p>
            )}
            {editMastersError && (
              <p role="alert" style={{ color: "#842029" }}>
                {editMastersError}
              </p>
            )}
            {editError && (
              <p role="alert" style={{ color: "#842029" }}>
                {editError}
              </p>
            )}
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Name:
              </label>
              <input
                type="text"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                disabled={loadingEditMasters || editSaving}
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
                disabled={loadingEditMasters || editSaving}
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
                disabled={loadingEditMasters || editSaving}
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
                disabled={loadingEditMasters || editSaving}
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
                disabled={loadingEditMasters || editSaving}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Source:
              </label>              
              <select
                value={editFormData.sourceId || ""}
                onChange={(e) => {
                  const selectedSource = leadSources.find(
                    (source) => String(source.id) === e.target.value
                  );
                  setEditFormData({
                    ...editFormData,
                    sourceId: e.target.value,
                    source: selectedSource?.name || ""
                  });
                  setEditError("");
                }}
                className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loadingEditMasters || Boolean(editMastersError)}
              >
                <option value="">Select Source</option>
                {leadSources.map((source) => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>

            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Status:
              </label>
              <select
                value={editFormData.statusId || ""}
                onChange={(e) => {
                  const selectedStatus = editStatusOptions.find(
                    (status) => String(status.id) === e.target.value
                  );
                  if (!selectedStatus) return;
                  const statusCode = normalizeCode(selectedStatus.code);
                  setEditFormData({
                    ...editFormData,
                    statusId: e.target.value,
                    statusCode: selectedStatus.code,
                    statusName: selectedStatus.name,
                    status: selectedStatus.name,
                    lostReasonId:
                      statusCode === "LOST"
                        ? editFormData.lostReasonId
                        : null
                  });
                  setEditError("");
                }}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                required
                disabled={loadingEditMasters || Boolean(editMastersError)}
              >
                <option value="">Select Status</option>
                {editStatusOptions.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            {normalizeCode(selectedStatusForEdit?.code) === "LOST" && (
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Lost Reason:
                </label>
                <select
                  value={editFormData.lostReasonId || ""}
                  onChange={(e) => {
                    setEditFormData({
                      ...editFormData,
                      lostReasonId: e.target.value || null
                    });
                    setEditError("");
                  }}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loadingEditMasters || Boolean(editMastersError)}
                >
                  <option value="">Select Lost Reason</option>
                  {lostReasons.map((reason) => (
                    <option key={reason.id} value={reason.id}>{reason.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving || loadingEditMasters || Boolean(editMastersError)}
                style={{
                  flex: 1,
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: editSaving || loadingEditMasters || editMastersError ? "not-allowed" : "pointer",
                  opacity: editSaving || loadingEditMasters || editMastersError ? 0.65 : 1,
                }}
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editSaving}
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

      {/* 🔹 Archive Confirmation Modal */}
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
          onClick={() => {
            if (archivingLeadId === null) {
              setShowDeleteModal(false);
              setDeleteConfirmId(null);
            }
          }}
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
            <h3 style={{ marginTop: 0, color: "#dc3545" }}>⚠️ Confirm Archive</h3>
            <p>Are you sure you want to archive this lead? You can restore it later.</p>
            {leadActionError && (
              <p role="alert" style={{ color: "#842029" }}>
                {leadActionError}
              </p>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={confirmDelete}
                disabled={archivingLeadId !== null}
                style={{
                  flex: 1,
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: archivingLeadId !== null ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  opacity: archivingLeadId !== null ? 0.7 : 1,
                }}
              >
                {archivingLeadId !== null ? "Archiving..." : "Archive"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmId(null);
                }}
                disabled={archivingLeadId !== null}
                style={{
                  flex: 1,
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: archivingLeadId !== null ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== IMPORT RESULT MODAL =================== */}
      {importResult && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "85vh",
              overflowY: "auto",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  color: "#212529",
                }}
              >
                CSV Import Result
              </h2>

              <button
                onClick={() => setImportResult(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6c757d",
                }}
              >
                ×
              </button>
            </div>

            {/* Summary Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {/* Total */}
              <div
                style={{
                  backgroundColor: "#e9ecef",
                  borderRadius: "8px",
                  padding: "15px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6c757d",
                    marginBottom: "6px",
                  }}
                >
                  Total Records
                </div>

                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: "700",
                    color: "#343a40",
                  }}
                >
                  {importResult.total}
                </div>
              </div>

              {/* Inserted */}
              <div
                style={{
                  backgroundColor: "#d1e7dd",
                  borderRadius: "8px",
                  padding: "15px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#146c43",
                    marginBottom: "6px",
                  }}
                >
                  Imported
                </div>

                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: "700",
                    color: "#146c43",
                  }}
                >
                  {importResult.inserted}
                </div>
              </div>

              {/* Failed */}
              <div
                style={{
                  backgroundColor:
                    importResult.failed > 0 ? "#f8d7da" : "#d1e7dd",
                  borderRadius: "8px",
                  padding: "15px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color:
                      importResult.failed > 0 ? "#842029" : "#146c43",
                    marginBottom: "6px",
                  }}
                >
                  Failed
                </div>

                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: "700",
                    color:
                      importResult.failed > 0 ? "#842029" : "#146c43",
                  }}
                >
                  {importResult.failed}
                </div>
              </div>
            </div>

            {/* Failed Records Section */}
            {importResult.errors &&
              importResult.errors.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: "17px",
                      marginBottom: "12px",
                      color: "#842029",
                    }}
                  >
                    Failed Records
                  </h3>

                  <div
                    style={{
                      border: "1px solid #dee2e6",
                      borderRadius: "8px",
                      overflowX: "auto",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: "450px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <th
                            style={{
                              padding: "10px",
                              borderBottom: "1px solid #dee2e6",
                              textAlign: "left",
                            }}
                          >
                            Row
                          </th>

                          <th
                            style={{
                              padding: "10px",
                              borderBottom: "1px solid #dee2e6",
                              textAlign: "left",
                            }}
                          >
                            Name
                          </th>

                          <th
                            style={{
                              padding: "10px",
                              borderBottom: "1px solid #dee2e6",
                              textAlign: "left",
                            }}
                          >
                            Reason
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {importResult.errors.map((error, index) => (
                          <tr key={index}>
                            <td
                              style={{
                                padding: "10px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {error.row}
                            </td>

                            <td
                              style={{
                                padding: "10px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {error.name || "-"}
                            </td>

                            <td
                              style={{
                                padding: "10px",
                                borderBottom: "1px solid #eee",
                                color: "#842029",
                              }}
                            >
                              {error.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* No Errors Message */}
            {(!importResult.errors ||
              importResult.errors.length === 0) && (
                <div
                  style={{
                    backgroundColor: "#d1e7dd",
                    color: "#146c43",
                    padding: "14px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  All records were imported successfully.
                </div>
              )}

            {/* Close Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "24px",
              }}
            >
              <button
                onClick={() => setImportResult(null)}
                style={{
                  backgroundColor: "#0d6efd",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "9px 20px",
                  cursor: "pointer",
                }}
              >
                Close
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
