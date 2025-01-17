import React from "react";
import { Outlet } from "react-router-dom";
import IMSStack from "../shared/IMSStack";
import Sidebar from "./Sidebar";

const Layout = () => {
  return (
    <>
      <IMSStack>
        <Sidebar />
        <IMSStack
          p={3}
          sx={{
            minHeight: "100vh",
            ml: 30,
            "@media print": {
              ml: 0,
              minHeight: "100vh",
              mt: 0,
              p: 0,
            },
          }}
        >
          <Outlet />
        </IMSStack>
      </IMSStack>
    </>
  );
};

export default Layout;
