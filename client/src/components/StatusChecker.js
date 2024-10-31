import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const StatusChecker = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentOutages, setRecentOutages] = useState([]);
  const [websites, setWebsites] = useState([]);

  useEffect(() => {
    fetchRecentOutages();
    fetchWebsites();
  }, []);

  const fetchRecentOutages = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/v1/outages/recent",
      );
      setRecentOutages(
        Array.isArray(response.data) ? response.data.slice(0, 4) : [],
      );
    } catch (error) {
      console.error("Error fetching recent outages:", error);
    }
  };

  const fetchWebsites = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/v1/websites");
      setWebsites(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching websites:", error);
    }
  };

  const checkStatus = async () => {
    if (!url) return;
    setIsLoading(true);

    // Clean the URL by removing http/https and www if present
    let cleanUrl = url
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");

    try {
      const response = await axios.post("http://localhost:5001/api/v1/status", {
        url: cleanUrl,
      });
      setStatus(response.data);
    } catch (error) {
      console.error("Error checking status:", error);
      setStatus({
        message:
          "Unable to check status. The website may be experiencing issues.",
        status: "error",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-grow">
            {/* Status Checker Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-12">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  Check if a website or app is{" "}
                  <span className="text-purple-600">
                    down for everyone or just you
                  </span>
                  .
                </h2>
              </div>

              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Enter website URL (e.g. facebook.com)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    onClick={checkStatus}
                    disabled={isLoading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Checking..." : "Check Status"}
                  </button>
                </div>

                {status && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-center">{status.message}</p>
                  </div>
                )}

                {!status && (
                  <p className="mt-4 text-gray-600 text-center text-sm">
                    Enter a website URL above to check if it's experiencing
                    issues.
                  </p>
                )}
              </div>
            </div>

            {/* Monitored Websites Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-6">
                Websites and Apps We Monitor
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {websites.map((website, index) => (
                  <Link
                    key={index}
                    to={`/website/${website.name}`}
                    className="p-3 text-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-blue-600 hover:text-blue-800"
                  >
                    {website.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-yellow-500">⚠️</span>
                Recent Outages and Problems
              </h3>
              {recentOutages.length > 0 ? (
                <ul className="space-y-3">
                  {recentOutages.map((outage, index) => (
                    <li
                      key={index}
                      className="flex flex-col py-2 border-b last:border-0"
                    >
                      <Link
                        to={`/website/${outage.website}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {outage.website}
                      </Link>
                      <span className="text-sm text-gray-600">
                        {new Date(outage.startedAt).toLocaleString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No recent outages</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusChecker;
