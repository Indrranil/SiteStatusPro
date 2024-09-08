import React, { useState, useEffect } from "react";

const CurrentOutages = () => {
  const [outages, setOutages] = useState([]);

  useEffect(() => {
    const fetchOutages = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/outages/current",
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setOutages(data);
      } catch (error) {
        console.error("Error fetching outages:", error);
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
      <h2 className="text-lg font-semibold mb-2 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 text-red-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          height="16"
          width="16"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        Outages Happening Right Now
      </h2>
      {outages.length > 0 ? (
        <ul className="space-y-2">
          {outages.map((outage) => (
            <li
              key={outage._id}
              className="flex justify-between items-center bg-red-100 p-2 rounded"
            >
              <a
                href={`/website/${outage.website}`}
                className="text-blue-600 hover:underline"
              >
                {outage.website}
              </a>
              <span className="text-sm text-gray-600">
                began {timeSince(outage.startedAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No current outages.</p>
      )}
    </div>
  );
};

export default CurrentOutages;
