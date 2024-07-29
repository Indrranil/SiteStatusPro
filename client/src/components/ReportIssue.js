// client/src/components/ReportIssue.js
import React, { useState } from "react";

const ReportIssue = () => {
  const [url, setUrl] = useState("");
  const [issue, setIssue] = useState("");

  const reportIssue = async () => {
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, issue }),
      });
      const data = await response.json();
      console.log("Issue reported:", data);
    } catch (error) {
      console.error("Error reporting issue:", error);
    }
  };

  return (
    <div>
      <h1>Report an Issue</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL"
      />
      <textarea
        value={issue}
        onChange={(e) => setIssue(e.target.value)}
        placeholder="Describe the issue"
      />
      <button onClick={reportIssue}>Report Issue</button>
    </div>
  );
};

export default ReportIssue;
