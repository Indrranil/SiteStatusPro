import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const WebsiteDetails = () => {
  const { id } = useParams();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/website/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setDetails(data);
      } catch (error) {
        console.error("Error fetching website details:", error);
      }
    };

    fetchDetails();
  }, [id]);

  return (
    <div>
      <h1>Website Details: {id}</h1>
      {details ? (
        <div>
          <p>Status: {details.status}</p>
          <p>Outages: {details.outages.length}</p>
          <p>History:</p>
          <ul>
            {details.outages.map((outage) => (
              <li key={outage._id}>
                {new Date(outage.startedAt).toLocaleString()} -{" "}
                {outage.isResolved ? "Resolved" : "Unresolved"}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default WebsiteDetails;
