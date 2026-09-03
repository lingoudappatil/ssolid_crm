import React, { useEffect, useState } from "react";

const ViewOrders = ({ onRefreshParent }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const fetchData = async () => {
    setLoading(true);
    try {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders`);
      if (!res.ok) throw new Error("Fetch failed");
      setOrders(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const input = document.getElementById("global-search");
    const handler = (e) => setQuery(e.target.value);
    if (input) input.addEventListener("input", handler);
    return () => input && input.removeEventListener("input", handler);
  }, []);

  const filtered = orders.filter(o => JSON.stringify(o).toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Orders</h3>
        <button onClick={() => { fetchData(); if (onRefreshParent) onRefreshParent(); }}>Refresh</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Order No.</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {pageData.length === 0 && <tr><td colSpan="6">No orders found.</td></tr>}
            {pageData.map((o, i) => (
              <tr key={o.orderId || o.orderId || i}>
                <td>{(page - 1) * perPage + i + 1}</td>
                <td>{o.orderNumber || o.ref || o.orderId}</td>
                <td>{o.name || o.customer || "-"}</td>
                <td>{o.totalAmount || o.amount || "-"}</td>
                <td>{o.status || "-"}</td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</td>
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
    </div>
  );
};

export default ViewOrders;
