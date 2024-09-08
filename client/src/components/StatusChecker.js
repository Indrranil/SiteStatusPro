import React, { useState, useEffect } from "react";
import axios from "axios";

const StatusChecker = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(null);
  const [currentOutages, setCurrentOutages] = useState([]);
  const [recentOutages, setRecentOutages] = useState([]);

  useEffect(() => {
    fetchCurrentOutages();
    fetchRecentOutages();
  }, []);

  const fetchCurrentOutages = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/outages/current",
      );
      setCurrentOutages(response.data);
    } catch (error) {
      console.error("Error fetching current outages:", error);
    }
  };

  const fetchRecentOutages = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/outages/recent",
      );
      setRecentOutages(response.data);
    } catch (error) {
      console.error("Error fetching recent outages:", error);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await axios.post("http://localhost:5001/api/status", {
        url,
      });
      setStatus(response.data);
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const timeSince = (timestamp) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diffInMinutes = Math.floor((now - date) / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else {
      return `${diffInHours} hours ago`;
    }
  };

  return (
    <div className="container">
      <h2>Check Website Status</h2>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL"
      />
      <button onClick={checkStatus}>Check Status</button>
      {status && (
        <div>
          <h3>Status:</h3>
          <p>{status.message}</p>
        </div>
      )}

      <div style={{ display: "flex", marginTop: "20px" }}>
        <div style={{ flex: 1, marginRight: "20px" }}>
          <h3>Outages Happening Right Now</h3>
          {currentOutages.length > 0 ? (
            <ul>
              {currentOutages.map((outage, index) => (
                <li key={index}>
                  {outage.website} - began {timeSince(outage.startedAt)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No current outages.</p>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h3>Recent Outages and Problems</h3>
          {recentOutages.length > 0 ? (
            <ul>
              {recentOutages.map((outage, index) => (
                <li key={index}>
                  {outage.website} - started {formatTimestamp(outage.startedAt)}{" "}
                  -{" "}
                  {outage.isResolved
                    ? `Resolved at ${formatTimestamp(outage.resolvedAt)}`
                    : "Ongoing"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent outages.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusChecker;
