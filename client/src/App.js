import React from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import StatusChecker from "./components/StatusChecker";
import CurrentOutages from "./components/currentOutages";
import RecentOutages from "./components/RecentOutages";
import WebsiteDetails from "./components/WebsiteDetails";
import ReportIssue from "./components/ReportIssue";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<StatusChecker />} />
        <Route path="/current-outages" element={<CurrentOutages />} />
        <Route path="/recent-outages" element={<RecentOutages />} />
        <Route path="/website/:id" element={<WebsiteDetails />} />
        <Route path="/report-issue" element={<ReportIssue />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
