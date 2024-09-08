import React from "react";

function Header() {
  return (
    <header className="bg-purple-600 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            height="16" // Explicitly set the height
            width="16" // Explicitly set the width
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          SiteStatusPro
        </h1>
        <div className="text-sm">
          Github :{" "}
          <a
            href="https://github.com/indrranil/SiteStatusPro"
            className="underline"
          >
            @SiteStatusPro
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
