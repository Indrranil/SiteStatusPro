import React, { useState } from "react";

const ReportIssue = ({ website }) => {
  const [selectedProblem, setSelectedProblem] = useState("");

  const handleReport = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ website, problemType: selectedProblem }),
      });
      if (response.ok) {
        alert("Issue reported!");
      } else {
        alert("Error reporting issue.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h2>What problem are you having with {website}?</h2>
      <div>
        {["Error received", "Inaccessible", "Login", "Slow"].map((problem) => (
          <button
            key={problem}
            onClick={() => setSelectedProblem(problem)}
            className="m-1 p-2 bg-blue-500 text-white rounded"
          >
            {problem}
          </button>
        ))}
      </div>
      <button
        onClick={handleReport}
        className="mt-2 p-2 bg-green-500 text-white rounded"
      >
        Report
      </button>
    </div>
  );
};

export default ReportIssue;
