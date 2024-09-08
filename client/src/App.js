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
    <div className="App bg-gray-100 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <StatusChecker />
        <CurrentOutages />
        <ReportIssue />
        <RecentOutages />
      </main>
      <Footer />
    </div>
  );
}

export default App;
