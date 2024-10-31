import React from "react";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="bg-purple-600 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🏠 SiteStatusPro</h1>
        <span>
          Github:{" "}
          <a
            href="https://github.com/SiteStatusPro"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            @SiteStatusPro
          </a>
        </span>
      </div>
    </header>
  );
}

export default Header;
