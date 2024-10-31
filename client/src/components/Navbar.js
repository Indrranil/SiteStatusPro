import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  const getLinkClass = ({ isActive }) =>
    isActive ? "text-white" : "text-gray-300 hover:text-white";

  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex space-x-4">
        <li>
          <NavLink to="/" className={getLinkClass}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/recent" className={getLinkClass}>
            Recent Outages
          </NavLink>
        </li>
        <li>
          <NavLink to="/website" className={getLinkClass}>
            Monitored Websites
          </NavLink>
        </li>
        <li>
          <NavLink to="/current" className={getLinkClass}>
            Current Outages
          </NavLink>
        </li>
        <li>
          <a
            href="https://ko-fi.com/indrranil"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white"
          >
            Donate
          </a>
        </li>
        <li>
          <NavLink to="/terms" className={getLinkClass}>
            Terms of Service
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
