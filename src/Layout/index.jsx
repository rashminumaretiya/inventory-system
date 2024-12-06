import React from "react";
import { Outlet } from "react-router-dom";
import IMSStack from "../shared/IMSStack";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  return (
    <>
      <IMSStack>
        <Sidebar />
        <Header />
        <IMSStack
          mt={8}
          p={3}
          sx={{
            minHeight: "calc(100vh - 64px)",
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
