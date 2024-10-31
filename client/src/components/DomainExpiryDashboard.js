import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCcw, Globe, Clock } from "lucide-react";

const DomainStatusDisplay = ({ website }) => {
  const [domainInfo, setDomainInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDomainInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Clean domain name
      const domain = website.toLowerCase() + ".com";

      console.log("Sending domain check request for:", domain);

      const response = await fetch(
        `http://localhost:5001/api/v1/domains/${website}/check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ domain }),
        },
      );

      const data = await response.json();
      console.log("Received domain data:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      setDomainInfo(data);
    } catch (err) {
      console.error("Domain check error:", err);
      setError(err.message || "Failed to check domain");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (website) {
      fetchDomainInfo();
    }
  }, [website]);

  const formatValue = (value, defaultText = "Not available") => {
    if (!value || value === "N/A" || value === "Not available") {
      return <span className="text-gray-400 italic">{defaultText}</span>;
    }
    try {
      // Try to parse date strings
      if (value.includes("/") || value.includes("-")) {
        return new Date(value).toLocaleDateString();
      }
    } catch {}
    return value;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Domain Check Failed</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{error}</p>
          <button
            onClick={fetchDomainInfo}
            className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium">Domain Status</h3>
        </div>
        <button
          onClick={fetchDomainInfo}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <RefreshCcw className="h-5 w-5" />
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Domain</span>
                <p className="font-medium mt-1">{domainInfo?.domain}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <p className="font-medium mt-1 capitalize">
                  {formatValue(domainInfo?.status)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Registrar</span>
                <p className="font-medium mt-1">
                  {formatValue(domainInfo?.registrar)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created Date</span>
                <p className="font-medium mt-1">
                  {formatValue(domainInfo?.createdDate)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Expiry Date</span>
                <p className="font-medium mt-1">
                  {formatValue(domainInfo?.expiryDate)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Days Until Expiry</span>
                <p className="font-medium mt-1">
                  {formatValue(domainInfo?.daysUntilExpiry, "N/A")}
                </p>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <Clock className="inline-block h-4 w-4 mr-1" />
              Last checked: {domainInfo?.lastChecked || "Never"}
            </div>
          </div>

          {/* Raw Data Display */}
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Show raw WHOIS data
            </summary>
            <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(domainInfo?.raw, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainStatusDisplay;
