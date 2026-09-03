// client/src/Components/FollowUps/ViewFollowUp.js

import React, { useEffect, useState } from "react";

export default function ViewFollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);

      const base =
        process.env.REACT_APP_API_URL || "http://localhost:5000";

      const res = await fetch(
        `${base.replace(/\/$/, "")}/api/followups`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to fetch follow-ups"
        );
      }

      setFollowUps(data);
    } catch (err) {
      console.error("❌ Error fetching follow-ups:", err);
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  return (
    <div className="followup-container p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          📅 All Follow-Ups
        </h2>

        <button
          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-400"
          onClick={fetchFollowUps}
        >
          Refresh
        </button>
      </div>

      <table className="followup-table min-w-full border border-gray-300 rounded">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 border-b text-left">
              Module
            </th>

            <th className="py-2 px-4 border-b text-left">
              Entry ID
            </th>

            <th className="py-2 px-4 border-b text-left">
              Follow-Up Date
            </th>

            <th className="py-2 px-4 border-b text-left">
              Remark
            </th>

            <th className="py-2 px-4 border-b text-left">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan="5"
                className="text-center py-4"
              >
                Loading follow-ups...
              </td>
            </tr>
          ) : followUps.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                className="text-center py-4 text-gray-500"
              >
                No follow-ups found
              </td>
            </tr>
          ) : (
            followUps.map((f) => (
              <tr
                key={f.id}
                className="hover:bg-gray-100"
              >
                <td className="py-2 px-4 border-b">
                  {f.relatedType}
                </td>

                <td className="py-2 px-4 border-b">
                  {f.relatedId}
                </td>

                <td className="py-2 px-4 border-b">
                  {new Date(
                    f.followUpDate
                  ).toLocaleString()}
                </td>

                <td className="py-2 px-4 border-b">
                  {f.notes || "-"}
                </td>

                <td className="py-2 px-4 border-b">
                  {f.status}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}