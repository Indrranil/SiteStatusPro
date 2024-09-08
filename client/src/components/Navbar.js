// fsd/client/src/components/Navbar.js
import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex space-x-4">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "text-white" : "text-gray-300"
            }
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/recent"
            className={({ isActive }) =>
              isActive ? "text-white" : "text-gray-300"
            }
          >
            Recent Outages
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/report"
            className={({ isActive }) =>
              isActive ? "text-white" : "text-gray-300"
            }
          >
            Report Issue
          </NavLink>
        </li>
        {/* Add more links here */}
      </ul>
    </nav>
  );
};

export default Navbar;
