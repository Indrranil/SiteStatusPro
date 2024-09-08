import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Line } from "react-chartjs-2"; // For graph
import { Pie } from "react-chartjs-2"; // For pie chart

const WebsiteDetails = () => {
  const { website } = useParams(); // Use 'website' parameter from the URL
  const [details, setDetails] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/website/${website}`,
        );
        const data = await response.json();
        setDetails(data);
      } catch (error) {
        console.error("Error fetching website details:", error);
      }
    };

    const fetchReports = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/reports/${website}`,
        );
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchDetails();
    fetchReports();
  }, [website]);

  // Prepare data for the graph
  const graphData = {
    labels: reports.map((report) =>
      new Date(report.timestamp).toLocaleTimeString(),
    ),
    datasets: [
      {
        label: "Number of Reports",
        data: reports.map((report) => 1), // Example data; adjust as needed
        fill: false,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
      },
    ],
  };

  // Prepare data for the pie chart
  const pieData = {
    labels: ["Error received", "Inaccessible", "Login", "Slow"],
    datasets: [
      {
        data: [
          reports.filter((report) => report.problemType === "Error received")
            .length,
          reports.filter((report) => report.problemType === "Inaccessible")
            .length,
          reports.filter((report) => report.problemType === "Login").length,
          reports.filter((report) => report.problemType === "Slow").length,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };

  const handleReport = async (problemType) => {
    try {
      await fetch("http://localhost:5001/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website,
          problemType,
          user: "Anonymous",
          country: "Unknown",
        }),
      });
      // Optionally, refresh the reports list
      fetchReports();
    } catch (error) {
      console.error("Error reporting issue:", error);
    }
  };

  return (
    <div>
      <h1>Website Details: {website}</h1>
      {details ? (
        <div>
          <h2>Status: {details.status}</h2>
          <h3>Outages: {details.outages}</h3>
          <h3>History:</h3>
          <ul>
            {details.history.map((event) => (
              <li key={event.timestamp}>
                {event.timestamp}: {event.status}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading...</p>
      )}

      <h2>Reports in the Last 30 Minutes</h2>
      <Line data={graphData} />

      <h2>What problem are you having with {website}?</h2>
      <button onClick={() => handleReport("Error received")}>
        Error received
      </button>
      <button onClick={() => handleReport("Inaccessible")}>Inaccessible</button>
      <button onClick={() => handleReport("Login")}>Login</button>
      <button onClick={() => handleReport("Slow")}>Slow</button>

      <h2>Common Problems at {website}</h2>
      <Pie data={pieData} />
    </div>
  );
};

export default WebsiteDetails;
