// client/src/components/Header.js
import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/current-outages">Current Outages</Link>
          </li>
          <li>
            <Link to="/recent-outages">Recent Outages</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
