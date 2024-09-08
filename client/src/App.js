// fsd/client/src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import StatusChecker from "./components/StatusChecker";
import CurrentOutages from "./components/CurrentOutages";
import RecentOutages from "./components/RecentOutages";
import WebsiteList from "./components/WebsiteList"; // Import WebsiteList
import WebsiteDetails from "./components/WebsiteDetails";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ReportIssue from "./components/ReportIssue";
import Navbar from "./components/Navbar";
import "./index.css";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<StatusChecker />} />
          <Route path="/recent" element={<RecentOutages />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/website" element={<WebsiteList />} />{" "}
          {/* Add WebsiteList route */}
          <Route path="/website/:website" element={<WebsiteDetails />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
