// src/layout/AppLayout.jsx
//
// Shell for all authenticated pages.
// SideNav is always visible; Navbar sits at the top of the content area.
// MessageUI floats over everything for toast notifications.

import { Outlet } from "react-router-dom";
import SideNav from "../components/sideNav/SideNav";
import MessageUI from "../components/messageUI/MessageUI";
import Navbar from "../components/navbar/Navbar";

export default function AppLayout() {
  return (
    <div className="content">
      <SideNav />

      <main>
        <MessageUI />
        <Navbar />
        <Outlet />
      </main>
    </div>
  );
}
