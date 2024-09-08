import React, { useState, useEffect } from "react";

const RecentOutages = () => {
  const [outages, setOutages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutages = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/outages/recent",
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        // Deduplicate outages based on website and sort by 'startedAt'
        const deduplicatedData = Array.from(
          new Map(data.map((outage) => [outage.website, outage])).values(),
        ).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
        setOutages(deduplicatedData);
      } catch (error) {
        console.error("Error fetching outages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutages();
  }, []);

  const timeSince = (timestamp) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diffInMinutes = Math.floor((now - date) / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  return (
    <div>
      <h1 className="text-lg font-semibold mb-2">
        Recent Outages and Problems
      </h1>
      {loading ? (
        <p>Loading...</p>
      ) : outages.length === 0 ? (
        <p>No recent outages.</p>
      ) : (
        <ul className="space-y-2">
          {outages.map((outage) => (
            <li
              key={outage._id}
              className="flex justify-between items-center bg-gray-100 p-2 rounded"
            >
              <a
                href={`/website/${outage.website}`}
                className="text-blue-600 hover:underline"
              >
                {outage.website}
              </a>
              <span className="text-sm text-gray-600">
                {timeSince(outage.startedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentOutages;
