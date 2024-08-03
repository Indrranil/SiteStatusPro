// fsd/client/src/components/StatusChecker.js
import React, { useState } from "react";
import axios from "axios";

const StatusChecker = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(null);

  const checkStatus = async () => {
    try {
      const response = await axios.post("http://localhost:5001/api/status", {
        url,
      });
      setStatus(response.data);
    } catch (error) {
      console.error(error);
      setStatus({ message: "Error checking status" });
    }
  };

  return (
    <div>
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
    </div>
  );
};

export default StatusChecker;
