// src/components/sideNav/SideNav.jsx
//
// Stripped from the old project:
//   - Removed ClockinMini (attendance feature)
//   - Removed ThemeButton (add back once ThemeContext is set up)
//   - Removed navModalVariant (add back once motionUtils is ported)
//   - Uses AccessControlContext for filtered navigation
//   - Uses useAuth for logout

import { SidebarSimpleIcon, SignOutIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useAccessControl } from "../../context/AccessControlContext";
import { useAuth } from "../../context/AuthContext";
import Button from "../buttons/button/Button";
import "./SideNav.scss";
import SideNavLink from "./sideNavLink/SideNavLink";

export default function SideNav() {
  const [navIsOpen, setNavIsOpen] = useState(true);
  const { navigation, loading } = useAccessControl();
  const { logout, user } = useAuth();

  return (
    <div className={`sideNav ${!navIsOpen ? "close" : ""}`}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sideNavSegment">
        <div className={`sideNavLogoContainer ${!navIsOpen ? "isClosed" : ""}`}>
          <button
            onClick={() => setNavIsOpen(!navIsOpen)}
            className="navButtonType1"
            aria-label="Toggle sidebar"
          >
            <SidebarSimpleIcon size="24" />
          </button>
        </div>

        {/* ── Nav segments ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="sideNavLoading">
            <div className="loadingCard" />
            <div className="loadingCard" />
            <div className="loadingCard" />
          </div>
        ) : (
          <div>
            {navigation.map((segment, index) => (
              <div key={index}>
                <div className="sideNavLinkLayout">
                  <SideNavLink segment={segment} navIsOpen={navIsOpen} />
                </div>
                <hr className="sideNavLinkHr" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer: user info + logout ───────────────────────────────────── */}
      <div className="sideNavFooter">
        {navIsOpen && (
          <div className="sideNavUserInfo">
            <p className="textXXS textBold">{user?.full_name}</p>
            <p className="textXXXS textLight sideNavRole">{user?.role}</p>
          </div>
        )}
        <Button
          style="button buttonType2 textXXS"
          onClick={logout}
          name={navIsOpen && "Log out"}
          icon={SignOutIcon}
        />
      </div>
    </div>
  );
}
