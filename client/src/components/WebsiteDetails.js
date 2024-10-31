// Part 1: Component Logic and State Management
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import DomainExpiryDashboard from "./DomainExpiryDashboard";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
);

const API_BASE_URL = "http://localhost:5001/api/v1";

const formatMetric = (value, decimals = 0, suffix = "ms") => {
  if (value === null || value === undefined) return `0${suffix}`;
  return `${Number(value).toFixed(decimals)}${suffix}`;
};

const WebsiteDetails = () => {
  const { website } = useParams();

  const [metrics, setMetrics] = useState({
    current: {
      responseTime: 0,
      loadTime: 0,
      availability: 0,
    },
    historical: {
      avgResponseTime: 0,
      avgLoadTime: 0,
      uptime: 0,
    },
    loading: true,
    error: null,
  });

  const [reportData, setReportData] = useState({
    counts: {
      errorReceived: 0,
      inaccessible: 0,
      login: 0,
      slow: 0,
    },
    timeline: {
      labels: [],
      values: [],
    },
    loading: true,
    error: null,
  });

  const [sslInfo, setSSLInfo] = useState({
    data: null,
    loading: true,
    error: null,
  });

  const [notification, setNotification] = useState(null);

  const fetchPerformanceMetrics = useCallback(async () => {
    try {
      setMetrics((prev) => ({ ...prev, loading: true, error: null }));
      const response = await fetch(
        `${API_BASE_URL}/performance/metrics/${website}`,
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setMetrics({
        current: {
          responseTime: data.current?.responseTime || 0,
          loadTime: data.current?.loadTime || 0,
          availability: data.current?.availability || 0,
        },
        historical: {
          avgResponseTime: data.historical?.average_response_time || 0,
          avgLoadTime: data.historical?.average_load_time || 0,
          uptime: data.historical?.uptime_percentage || 0,
        },
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      setMetrics((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load performance metrics",
      }));
    }
  }, [website]);

  const fetchReportData = useCallback(async () => {
    try {
      setReportData((prev) => ({ ...prev, loading: true, error: null }));
      const response = await fetch(`${API_BASE_URL}/reports/${website}`);

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setReportData({
        counts: {
          errorReceived: data.pieData?.errorReceived || 0,
          inaccessible: data.pieData?.inaccessible || 0,
          login: data.pieData?.login || 0,
          slow: data.pieData?.slow || 0,
        },
        timeline: {
          labels: Object.keys(data.reportCountsOverTime || {}),
          values: Object.values(data.reportCountsOverTime || {}),
        },
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load reports",
      }));
    }
  }, [website]);

  const fetchSSLInfo = useCallback(async () => {
    try {
      setSSLInfo((prev) => ({ ...prev, loading: true, error: null }));
      const response = await fetch(`${API_BASE_URL}/ssl/${website}/status`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch SSL info");
      }

      setSSLInfo({
        data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setSSLInfo({
        data: null,
        loading: false,
        error: error.message,
      });
    }
  }, [website]);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleReport = useCallback(
    async (problemType) => {
      try {
        const response = await fetch(`${API_BASE_URL}/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            website,
            problemType,
            user: "Anonymous",
            country: "Unknown",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        showNotification("Report submitted successfully");
        await fetchReportData();
      } catch (error) {
        console.error("Error reporting issue:", error);
        showNotification("Failed to submit report", "error");
      }
    },
    [website, fetchReportData, showNotification],
  );

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchPerformanceMetrics(),
        fetchReportData(),
        fetchSSLInfo(),
      ]);
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchPerformanceMetrics, fetchReportData, fetchSSLInfo]);

  const chartOptions = {
    line: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
    },
    pie: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  };

  const chartData = {
    line: {
      labels: reportData.timeline.labels,
      datasets: [
        {
          label: "Reports",
          data: reportData.timeline.values,
          fill: false,
          backgroundColor: "rgba(75,192,192,0.4)",
          borderColor: "rgba(75,192,192,1)",
          tension: 0.4,
        },
      ],
    },
    pie: {
      labels: ["Error received", "Inaccessible", "Login", "Slow"],
      datasets: [
        {
          data: [
            reportData.counts.errorReceived,
            reportData.counts.inaccessible,
            reportData.counts.login,
            reportData.counts.slow,
          ],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
        },
      ],
    },
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "valid":
        return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case "warning":
        return <ShieldAlert className="w-5 h-5 text-yellow-500" />;
      case "critical":
      case "expired":
        return <ShieldX className="w-5 h-5 text-red-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "valid":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
      case "expired":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Website Details: {website}</h1>

      {notification && (
        <Alert
          variant={notification.type === "success" ? "default" : "destructive"}
          className="mb-4"
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {notification.type === "success" ? "Success" : "Error"}
          </AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* SSL Certificate Section */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {sslInfo.data ? (
              getStatusIcon(sslInfo.data.status)
            ) : (
              <Shield className="w-5 h-5" />
            )}
            SSL Certificate Status
          </h3>
        </CardHeader>
        <CardContent>
          {sslInfo.loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ) : sslInfo.error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{sslInfo.error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p
                    className={`text-lg font-medium ${getStatusColor(sslInfo.data?.status)}`}
                  >
                    {sslInfo.data?.status?.charAt(0).toUpperCase() +
                      sslInfo.data?.status?.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Days Remaining</p>
                  <p className="text-lg font-medium">
                    {sslInfo.data?.daysRemaining || 0}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Issuer</p>
                <p className="text-medium">{sslInfo.data?.issuer}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="text-medium">
                  {sslInfo.data?.validTo
                    ? new Date(sslInfo.data.validTo).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              {sslInfo.data?.status !== "valid" && (
                <Alert
                  variant={
                    sslInfo.data?.status === "warning"
                      ? "default"
                      : "destructive"
                  }
                >
                  <AlertTitle>Certificate {sslInfo.data?.status}</AlertTitle>
                  <AlertDescription>
                    {sslInfo.data?.status === "expired"
                      ? "The SSL certificate has expired. Website security is compromised."
                      : `Certificate will expire in ${sslInfo.data?.daysRemaining} days. Please renew soon.`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics Section */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Performance Metrics</h2>
        </CardHeader>
        <CardContent>
          {metrics.loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 animate-pulse rounded"
                />
              ))}
            </div>
          ) : metrics.error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{metrics.error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-8">
              {/* Current Metrics */}
              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatMetric(metrics.current.responseTime)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Load Time</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatMetric(metrics.current.loadTime)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Availability</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatMetric(metrics.current.availability, 1, "%")}
                  </p>
                </div>
              </div>

              {/* Continuing from 24 Hour Average */}
              <div>
                <h3 className="text-lg font-semibold mb-4">24 Hour Average</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                    <p className="text-xl font-bold">
                      {formatMetric(metrics.historical.avgResponseTime)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Avg Load Time</p>
                    <p className="text-xl font-bold">
                      {formatMetric(metrics.historical.avgLoadTime)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="text-xl font-bold">
                      {formatMetric(metrics.historical.uptime, 1, "%")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain Expiry Section */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Domain Information</h2>
        </CardHeader>
        <CardContent>
          <DomainExpiryDashboard website={website} />
        </CardContent>
      </Card>

      {/* Report Issue Section */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Report an Issue</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => handleReport("Error received")}
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
            >
              Error received
            </button>
            <button
              onClick={() => handleReport("Inaccessible")}
              className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition"
            >
              Inaccessible
            </button>
            <button
              onClick={() => handleReport("Login")}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
            >
              Login
            </button>
            <button
              onClick={() => handleReport("Slow")}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition"
            >
              Slow
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      {!reportData.loading && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Reports Timeline</h2>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Line data={chartData.line} options={chartOptions.line} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Issue Distribution</h2>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Pie data={chartData.pie} options={chartOptions.pie} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WebsiteDetails;
