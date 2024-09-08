import React, { useState } from "react";

const ReportIssue = () => {
  const [website, setWebsite] = useState("");
  const [issue, setIssue] = useState("");
  const [user, setUser] = useState("");
  const [country, setCountry] = useState("");

  const reportIssue = async () => {
    try {
      // Debugging: Log the data being sent
      console.log({ website, issue, user, country });

      const response = await fetch("http://localhost:5001/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ website, issue, user, country }), // Ensure 'issue' is included
      });
      const data = await response.json();
      console.log("Issue reported:", data);
    } catch (error) {
      console.error("Error reporting issue:", error);
    }
  };

  return (
    <div className="container report-issue-container">
      <h1 className="report-issue-title">Report an Issue</h1>
      <form className="report-issue-form">
        <div className="form-group">
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Enter website URL"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <textarea
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Describe the issue"
            className="form-textarea"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Enter your name"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Enter your country"
            className="form-input"
          />
        </div>
        <button onClick={reportIssue} className="submit-button">
          Report Issue
        </button>
      </form>
    </div>
  );
};

export default ReportIssue;
