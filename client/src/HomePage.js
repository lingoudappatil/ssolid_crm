import React, { useState, useEffect, useContext } from "react";
// import "./Components/css/main.css";
import "./Components/css/Home.css";
import Lead from "./Components/Leads/AddLead";
import Quotation from "./Components/Quotation/AddQuotation";
import AddCustomerForm from "./Components/Customer/AddCustomer";
import Order from "./Components/Order/AddOrder";
import ViewCustomers from "./Components/Customer/ViewCustomer";
import ViewLeads from "./Components/Leads/ViewLeads";
import ViewQuotations from "./Components/Quotation/ViewQuotation";
import ViewOrders from "./Components/Order/ViewOrder";
import ViewFollowUps from "./Components/FollowUps/ViewFollowUp";
import Todo from "./Components/TODO/AddTodo";
import ViewTodo from "./Components/TODO/ViewTodo";
import FollowUpPage from "./Components/FollowUps/AddFollowUp";
import Settings from "./Components/Settings/Settings";
import { useSettings } from "./context/SettingsContext";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

const HomePage = ({ setCurrentPage, loggedInUser }) => {
  const { moduleSettings: settings } = useSettings();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customerCount, setCustomerCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);
  const [quotationsCount, setQuotationsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [expandedModule, setExpandedModule] = useState(null);
  const [activeSub, setActiveSub] = useState(null);

  // Include Settings in the sidebar
  const modules = ["Lead", "Quotation", "Order", "Customer", "Follow-Up", "ToDo", "Settings"];

  const defaultBase = process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";
  const baseUrl = process.env.REACT_APP_API_URL || defaultBase;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch counts for Dashboard
  const fetchCustomerCount = async () => {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/customers`);
      const data = await res.json();
      setCustomerCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchLeadsCount = async () => {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/leads`);
      const data = await res.json();
      setLeadsCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchQuotationsCount = async () => {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/quotations`);
      const data = await res.json();
      setQuotationsCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchOrdersCount = async () => {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/orders`);
      const data = await res.json();
      setOrdersCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeModule === "Dashboard") {
      fetchCustomerCount();
      fetchLeadsCount();
      fetchQuotationsCount();
      fetchOrdersCount();
    }
  }, [activeModule]);

  // Sidebar navigation logic
  const toggleModule = (mod) => {
    setExpandedModule(expandedModule === mod ? null : mod);
  };

  const handleSelectSub = (mod, sub) => {
    setActiveModule(mod);
    setActiveSub(sub);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setCurrentPage("login");
    }
  };

  const chartData = [
    { name: "Customers", value: customerCount },
    { name: "Leads", value: leadsCount },
    { name: "Quotations", value: quotationsCount },
    { name: "Orders", value: ordersCount },
  ];

  const getIcon = (item) => {
    const icons = {
      Dashboard: "📊",
      Lead: "📈",
      Quotation: "📃",
      Order: "📦",
      Customer: "👥",
      "Follow-Up": "🔔",
      ToDo: "📝",
      Settings: "⚙️",
      Logout: "🚪",
    };
    return <span>{icons[item] || "🔹"}</span>;
  };

  // Render main content area
  const renderContent = () => {
    if (activeModule === "Dashboard") {
      return (
        <div className="dashboard-content">
          <p>
            📊 Welcome to Lingouda's Dashboard! Overview of activities & sales operations.
          </p>

          <div className="stats-grid">
            <div className="stat-card customers">
              <div className="stat-content">
                <div className="stat-label">Customers</div>
                <div className="stat-value">{customerCount}</div>
              </div>
              <div className="stat-icon">👥</div>
            </div>

            <div className="stat-card leads">
              <div className="stat-content">
                <div className="stat-label">Leads</div>
                <div className="stat-value">{leadsCount}</div>
              </div>
              <div className="stat-icon">📈</div>
            </div>

            <div className="stat-card quotations">
              <div className="stat-content">
                <div className="stat-label">Quotations</div>
                <div className="stat-value">{quotationsCount}</div>
              </div>
              <div className="stat-icon">📃</div>
            </div>

            <div className="stat-card orders">
              <div className="stat-content">
                <div className="stat-label">Orders</div>
                <div className="stat-value">{ordersCount}</div>
              </div>
              <div className="stat-icon">📦</div>
            </div>
          </div>



          {/* Charts */}
          <div className="charts-container">
            <div className="chart-wrapper">
              <h3>Activity Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-wrapper">
              <h3>Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={["#8884d8", "#82ca9d", "#ffc658", "#ff7300"][index % 4]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case "Lead":
        if (activeSub === "Add") return <Lead onAdded={fetchLeadsCount} />;
        if (activeSub === "View") return <ViewLeads onRefreshParent={fetchLeadsCount} />;
        break;
      case "Quotation":
        if (activeSub === "Add") return <Quotation />;
        if (activeSub === "View")
          return <ViewQuotations onRefreshParent={fetchQuotationsCount} />;
        break;
      case "Order":
        if (activeSub === "Add") return <Order />;
        if (activeSub === "View")
          return <ViewOrders onRefreshParent={fetchOrdersCount} />;
        break;
      case "Customer":
        if (activeSub === "Add")
          return <AddCustomerForm onCustomerAdded={fetchCustomerCount} />;
        if (activeSub === "View")
          return <ViewCustomers onRefreshParent={fetchCustomerCount} />;
        break;
      case "Follow-Up":
        if (activeSub === "Add") return <FollowUpPage />;
        if (activeSub === "View") return <ViewFollowUps />;
        break;
      case "ToDo":
        if (activeSub === "Add") return <Todo />;
        if (activeSub === "View") return <ViewTodo />;
        break;
      case "Settings":
        return <Settings />;
      default:
        return <div>Welcome — choose a module from the left.</div>;
    }
  };

  // 🌙 Apply theme from SettingsContext globally
  useEffect(() => {
    document.body.className = settings.theme === "dark" ? "dark" : "light";
  }, [settings.theme]);

  return (
    <div className={`container ${settings.theme === "dark" ? "dark" : "light"}`}>
      {/* Top Bar */}
      <div className={`top-bar ${settings.theme === "dark" ? "dark" : "light"}`}>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "⬅️" : "➡️"}
        </button>
        <h2 className="top-bar-title">Welcome, {loggedInUser?.name || "Admin"}</h2>
        <div className="search-container">
          <input type="text" placeholder="Search..." className="search-bar" />
        </div>
        <span style={{ marginLeft: "auto", color: "white" }}>
          {currentTime.toLocaleTimeString()}
        </span>
        <span className="notification-bell">🔔</span>
      </div>

      {/* Content Area */}
      <div className="content-wrapper">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? "expanded" : "collapsed"}`}>
          <h2 className="logo">{sidebarOpen ? "My Sale App" : "🔷"}</h2>
          <ul className="sidebar-list">
            {/* Dashboard */}
            <li
              className={`sidebar-list-item ${activeModule === "Dashboard" ? "active" : ""
                }`}
              onClick={() => {
                setActiveModule("Dashboard");
                setActiveSub(null);
                setExpandedModule(null);
              }}
            >
              {getIcon("Dashboard")}
              {sidebarOpen && <span style={{ marginLeft: "10px" }}>Dashboard</span>}
            </li>

            {/* Main Modules */}
            {modules.map((mod) => (
              <li key={mod} className="module-group">
                {mod === "Settings" ? (
                  <div
                    className={`sidebar-list-item ${activeModule === "Settings" ? "active" : ""
                      }`}
                    onClick={() => setActiveModule("Settings")}
                  >
                    {getIcon(mod)}
                    {sidebarOpen && <span style={{ marginLeft: 10 }}>{mod}</span>}
                  </div>
                ) : (
                  <>
                    <div
                      className={`sidebar-list-item module-item ${activeModule === mod && !activeSub ? "active" : ""
                        }`}
                      onClick={() => toggleModule(mod)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {getIcon(mod)}
                        {sidebarOpen && <span style={{ marginLeft: 10 }}>{mod}</span>}
                      </div>
                      {sidebarOpen && (
                        <span style={{ marginRight: 8 }}>
                          {expandedModule === mod ? "▾" : "▸"}
                        </span>
                      )}
                    </div>

                    {expandedModule === mod && (
                      <ul className="submenu">
                        <li
                          className={`sidebar-subitem ${activeModule === mod && activeSub === "Add" ? "active" : ""
                            }`}
                          onClick={() => handleSelectSub(mod, "Add")}
                        >
                          ➕ {sidebarOpen && <span style={{ marginLeft: 8 }}>Add {mod}</span>}
                        </li>
                        <li
                          className={`sidebar-subitem ${activeModule === mod && activeSub === "View" ? "active" : ""
                            }`}
                          onClick={() => handleSelectSub(mod, "View")}
                        >
                          🔎{" "}
                          {sidebarOpen && <span style={{ marginLeft: 8 }}>View {mod}s</span>}
                        </li>
                      </ul>
                    )}
                  </>
                )}
              </li>
            ))}

            {/* Logout */}
            <li className="sidebar-list-item" onClick={handleLogout}>
              {getIcon("Logout")}
              {sidebarOpen && <span style={{ marginLeft: "10px" }}>Logout</span>}
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <h1>
            {activeModule}
            {activeSub ? ` — ${activeSub}` : ""}
          </h1>

          {activeModule === "Dashboard" && (
            <div className="marquee-wrapper">
              <marquee behavior="scroll" direction="left" className="marquee">
                📢 Welcome to Sales Dashboard! Stay updated with the latest info.
              </marquee>
            </div>
          )}

          <div className="page-content">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
