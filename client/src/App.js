import React from "react";
import { Routes, Route } from "react-router-dom";
import StatusChecker from "./components/StatusChecker";
import CurrentOutages from "./components/CurrentOutages";
import RecentOutages from "./components/RecentOutages";
import WebsiteList from "./components/WebsiteList";
import WebsiteDetails from "./components/WebsiteDetails";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ReportIssue from "./components/ReportIssue";
import Navbar from "./components/Navbar";
import Terms from "./components/Terms"; // Fixed the import
import "./index.css";
import "./styles/StatusChecker.css";
import "./styles/globals.css";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <Routes>
            <Route path="/" element={<StatusChecker />} />
            <Route path="/recent" element={<RecentOutages />} />
            <Route path="/current" element={<CurrentOutages />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/website" element={<WebsiteList />} />
            <Route path="/website/:website" element={<WebsiteDetails />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
