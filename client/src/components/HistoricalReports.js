import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

const HistoricalReports = ({ reportData, threshold = 15 }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Reports: ${context.parsed.y}`;
          },
          title: function (context) {
            return `Time: ${context[0].label}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          precision: 0,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  const data = {
    labels: reportData.labels,
    datasets: [
      {
        fill: true,
        data: reportData.values,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Live Problem Reports</h3>
      <p className="text-sm text-gray-600 mb-4">
        The graph below shows outage reports from users over the past 24 hours.
        Reports above threshold ({threshold}) indicate potential problems.
      </p>
      <div className="h-[300px]">
        <Line options={options} data={data} />
      </div>
    </div>
  );
};

export default HistoricalReports;
