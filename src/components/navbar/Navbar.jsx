import React from "react";
import "./Navbar.scss";
import logo from "/src/assets/favicon.svg";
import { Link } from "react-router";

function Navbar() {
  return (
    <nav className="navbar">
      {/* LOGO & HEADER */}
      <div className="navbarSegment navbarLogoContainer">
        <Link to="./dashboard" className="textBold textS navbarLogo">
          <img src={logo} alt="Logo" style={{ width: "40px" }} />
          AI-Integrated PMS
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
