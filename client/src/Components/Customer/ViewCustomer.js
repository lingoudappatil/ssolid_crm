import React, { useEffect, useState } from "react";

const TableToolbar = ({ onRefresh, count }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
    <button onClick={onRefresh}>🔁 Refresh ({count})</button>
    <input placeholder="Search..." id="global-search" style={{ padding: 6 }} />
  </div>
);

const ViewCustomers = ({ onRefreshParent }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const fetchData = async () => {
    setLoading(true);
    try {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const res = await fetch(`${base.replace(/\/$/, '')}/api/customers`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const input = document.getElementById("global-search");
    const handler = (e) => setQuery(e.target.value);
    if (input) input.addEventListener("input", handler);
    return () => input && input.removeEventListener("input", handler);
  }, []);

  const filtered = customers.filter(c =>
    JSON.stringify(c).toLowerCase().includes(query.toLowerCase())
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Customers</h3>
        <div>
          <button onClick={() => { fetchData(); if (onRefreshParent) onRefreshParent(); }}>Refresh</button>
        </div>
      </div>

      <TableToolbar onRefresh={fetchData} count={customers.length} />

      {loading ? <p>Loading...</p> :
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Company</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 && <tr><td colSpan="6">No customers found.</td></tr>}
                {pageData.map((c, i) => (
                  <tr key={c._id || c.id || i}>
                    <td>{(page - 1) * perPage + i + 1}</td>
                    <td>{c.name || c.fullName || c.customerName || "-"}</td>
                    <td>{c.email || "-"}</td>
                    <td>{c.mobile || c.phone || "-"}</td>
                    <td>{c.company || c.organisation || "-"}</td>
                    <td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button onClick={() => setPage(1)} disabled={page === 1}>First</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <span>Page {page} / {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next</button>
            <button onClick={() => setPage(pageCount)} disabled={page === pageCount}>Last</button>
          </div>
        </>
      }
    </div>
  );
};

export default ViewCustomers;
