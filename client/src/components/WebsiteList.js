// fsd/client/src/components/WebsiteList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const WebsiteList = () => {
  const [websites, setWebsites] = useState([]);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/websites");
        const data = await response.json();
        setWebsites(data);
      } catch (error) {
        console.error("Error fetching websites:", error);
      }
    };

    fetchWebsites();
  }, []);

  return (
    <div>
      <h1>Monitored Websites</h1>
      <ul>
        {websites.map((website) => (
          <li key={website.name}>
            <Link to={`/website/${website.name}`}>{website.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WebsiteList;
