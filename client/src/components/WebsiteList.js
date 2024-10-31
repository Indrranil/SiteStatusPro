import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const WebsiteList = () => {
  const [websites, setWebsites] = useState([]);
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/v1/websites");
        const data = await response.json();
        setWebsites(data);
      } catch (error) {
        console.error("Error fetching websites:", error);
      }
    };

    fetchWebsites();
  }, []);

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
      {websites.map((website) => (
        <Link
          key={website.name}
          to={`/website/${website.name}`}
          className="bg-white p-4 rounded shadow hover:shadow-md transition-shadow duration-200 text-center"
        >
          {website.name}
        </Link>
      ))}
    </div>
  );
};

export default WebsiteList;
