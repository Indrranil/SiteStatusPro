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
    <div className="container">
      <h1>Report an Issue</h1>
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="Enter website URL"
      />
      <textarea
        value={issue}
        onChange={(e) => setIssue(e.target.value)}
        placeholder="Describe the issue"
      />
      <input
        type="text"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        placeholder="Enter your name"
      />
      <input
        type="text"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        placeholder="Enter your country"
      />
      <button onClick={reportIssue}>Report Issue</button>
    </div>
  );
};

export default ReportIssue;
