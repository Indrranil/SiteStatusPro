// fsd/client/src/App.js
import React from "react";
import StatusChecker from "./components/StatusChecker";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="App">
      <Header />
      <StatusChecker />
      <Footer />
    </div>
  );
}

export default App;
