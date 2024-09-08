// client/src/components/WebsiteDetails.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const WebsiteDetails = () => {
  const { id } = useParams();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/website/${id}`);
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
          <p>Outages: {details.outages}</p>
          <p>History:</p>
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
    </div>
  );
};

export default WebsiteDetails;
