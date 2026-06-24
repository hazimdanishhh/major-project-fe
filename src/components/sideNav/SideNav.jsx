import "./SideNav.scss";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDotsIcon,
  ClockUserIcon,
  SidebarSimpleIcon,
  SignInIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { navModalVariant } from "../../../../../Hyrax Oil Web Apps/hyrax-central-portal/src/functions/motionUtils";
import { useRef, useState } from "react";
import { useTheme } from "../../../../../Hyrax Oil Web Apps/hyrax-central-portal/src/context/ThemeContext";
import { sideNavLinkData } from "../../../../../Hyrax Oil Web Apps/hyrax-central-portal/src/data/sideNavLinkData";
import SideNavLink from "./sideNavLink/SideNavLink";
import ThemeButton from "../../../../../Hyrax Oil Web Apps/hyrax-central-portal/src/components/buttons/themeButton/ThemeButton";
import LogoutButton from "../../../../../Hyrax Oil Web Apps/hyrax-central-portal/src/components/buttons/logoutButton/LogoutButton";
import ClockinMini from "../../../../../Hyrax Oil Web Apps/hyrax-central-portal/src/components/attendanceActivityClockin/clockinMini/ClockinMini";
import { useAccessControl } from "../../../../../Hyrax Oil Web Apps/hyrax-central-portal/src/context/AccessControlContext";
import LoadingIcon from "../loadingIcon/LoadingIcon";
import CardLayout from "../cardLayout/CardLayout";

export default function SideNav() {
  const [navIsOpen, setNavIsOpen] = useState(true);
  const { darkMode, toggleMode } = useTheme();
  const navModalRef = useRef(null);
  const { navigation, loading: accessLoading } = useAccessControl();

  return (
    <>
      <motion.div
        className={`sideNav ${darkMode ? "sectionDark" : "sectionLight"} ${
          !navIsOpen ? "close" : ""
        }`}
        variants={navModalVariant}
        ref={navModalRef}
      >
        {/* HEADER */}
        <div className="sideNavSegment">
          {/* DARK MODE + OPEN CLOSE SIDENAV */}
          <div
            className={`sideNavLogoContainer ${!navIsOpen ? "isClosed" : ""} ${
              darkMode ? "sectionDark" : "sectionLight"
            }`}
          >
            {navIsOpen && <ThemeButton style="iconButton" />}
            <button
              onClick={() => setNavIsOpen(!navIsOpen)}
              className="navButtonType1"
            >
              <SidebarSimpleIcon size="24" />
            </button>
          </div>

          {/* ATTENDANCE ACTIVITY BUTTON */}
          <ClockinMini navIsOpen={navIsOpen} />

          {/* NAV SEGMENTS */}
          {accessLoading ? (
            <CardLayout>
              <div className="loadingCard" />
              <div className="loadingCard" />
              <div className="loadingCard" />
            </CardLayout>
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

        <div className="sideNavButtons">
          <LogoutButton navIsOpen={navIsOpen} style="button buttonType2" />
        </div>
      </motion.div>
    </>
  );
}
