import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RecentOutages = () => {
  const [outages, setOutages] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOutages = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/v1/outages/recent",
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            credentials: "include", // Handles authentication if needed
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setOutages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch outages. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOutages();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!outages.length) {
    return (
      <Alert className="m-4">
        <AlertDescription>No recent outages found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Recent Outages</h2>
      <div className="space-y-4">
        {outages.map((outage, index) => (
          <div key={index} className="border rounded p-4 shadow-sm bg-white">
            <h3 className="font-medium">{outage.title}</h3>
            <p className="text-gray-600">{outage.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              {new Date(outage.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOutages;
