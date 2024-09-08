// client/src/components/RecentOutages.js
import React, { useState, useEffect } from "react";

const RecentOutages = () => {
  const [outages, setOutages] = useState([]);

  useEffect(() => {
    const fetchOutages = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/outages/recent",
        );
        const data = await response.json();
        setOutages(data);
      } catch (error) {
        console.error("Error fetching outages:", error);
      }
    };

    fetchOutages();
  }, []);

  return (
    <div>
      <h1>Recent Outages</h1>
      <ul>
        {outages.map((outage) => (
          <li key={outage.id}>
            <a href={`/website/${outage.website}`}>{outage.website}</a>:{" "}
            {outage.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentOutages;
