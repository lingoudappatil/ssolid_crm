import React, { useState } from "react";
import "./datefilter.css"; // ✅ Import the external CSS file

const DateFilter = ({ onFilter }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const applyFilter = () => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    onFilter(start, end);
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    onFilter(null, null);
  };

  return (
    <div className="date-filter-container">
      <label>From:</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="date-input"
      />
      <label>To:</label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="date-input"
      />
      <button onClick={applyFilter} className="apply-btn">
        Apply
      </button>
      <button onClick={clearFilter} className="clear-btn">
        Clear
      </button>
    </div>
  );
};

export default DateFilter;
