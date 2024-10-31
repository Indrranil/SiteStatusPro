import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PerformanceDashboard = ({ website }) => {
  const [metrics, setMetrics] = useState({
    current: {
      responseTime: null,
      loadTime: null,
      availability: null,
    },
    historical: {
      avgResponseTime: null,
      avgLoadTime: null,
      uptime: null,
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        console.log("Fetching performance data for:", website);
        setMetrics((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `http://localhost:5001/api/v1/performance/metrics/current?url=${encodeURIComponent(website)}`,
        );
        console.log("Performance API response status:", response.status);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log("Performance data received:", data);

        setMetrics({
          current: {
            responseTime:
              data?.current?.responseTime || data?.metrics?.ttfb?.value || 0,
            loadTime:
              data?.current?.loadTime || data?.metrics?.loadTime?.value || 0,
            availability: data?.current?.availability || 100,
          },
          historical: {
            avgResponseTime:
              data?.historical?.avgResponseTime || data?.metrics?.avgTTFB || 0,
            avgLoadTime:
              data?.historical?.avgLoadTime || data?.metrics?.avgLoadTime || 0,
            uptime: data?.historical?.uptime || 100,
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
    };

    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000);
    return () => clearInterval(interval);
  }, [website]);

  if (metrics.loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 animate-pulse bg-gray-200 rounded-lg"></div>
          <div className="h-24 animate-pulse bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (metrics.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{metrics.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>

      {/* Current Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.current.responseTime}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ms
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Load Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.current.loadTime}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ms
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 24 Hour Average */}
      <Card>
        <CardHeader>
          <CardTitle>24 Hour Average</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-xl font-bold">
                {metrics.historical.avgResponseTime} ms
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Load Time</p>
              <p className="text-xl font-bold">
                {metrics.historical.avgLoadTime} ms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.current.availability}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Uptime: {metrics.historical.uptime}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
