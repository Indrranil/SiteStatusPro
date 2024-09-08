// fsd/client/src/App.js
import React from "react";
import StatusChecker from "./components/StatusChecker";
import CurrentOutages from "./components/CurrentOutages";
import RecentOutages from "./components/RecentOutages";
import WebsiteDetails from "./components/WebsiteDetails";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ReportIssue from "./components/ReportIssue";
import "./index.css";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <StatusChecker />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <CurrentOutages />
            <RecentOutages />
            <ReportIssue />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
