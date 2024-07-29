// client/src/components/StatusChecker.js
import React, { useState } from "react";

const StatusChecker = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(null);

  const checkStatus = async () => {
    try {
      const response = await fetch(
        `/api/status?url=${encodeURIComponent(url)}`,
      );
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  return (
    <div>
      <h1>Check Website Status</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL"
      />
      <button onClick={checkStatus}>Check Status</button>
      {status && (
        <div>
          <h2>Status for {url}</h2>
          <p>{status.message}</p>
        </div>
      )}
    </div>
  );
};

export default StatusChecker;
