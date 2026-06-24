import { Outlet } from "react-router-dom";
import MessageUI from "../components/messageUI/MessageUI";
// import Navbar from "../components/navbar/Navbar";
// import SideNav from "../components/sideNav/SideNav";

export default function AppLayout() {
  return (
    <div className="content">
      {/* <SideNav /> */}

      <main>
        <MessageUI />
        {/* <Navbar /> */}
        <Outlet />
      </main>
    </div>
  );
}
