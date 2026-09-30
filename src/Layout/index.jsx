import { Drawer, useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import IMSBox from "../shared/IMSBox";
import { BOTTOM_NAV_HEIGHT, SIDEBAR_WIDTH } from "../shared/theme";
import BottomNav from "./BottomNav";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  // Never leave the drawer open behind a new screen.
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <IMSBox sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop needs no top bar: the sidebar carries identity and the bell,
          and each page opens with its own title. */}
      {isMobile && <Header onMenuClick={() => setDrawerOpen(true)} />}

      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: SIDEBAR_WIDTH, border: 0 } }}
        >
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              border: 0,
              overflow: "hidden",
            },
            "@media print": { display: "none" },
          }}
        >
          <Sidebar showBell />
        </Drawer>
      )}

      <IMSBox
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 2.5, md: 4 },
          pt: { xs: `${56 + 16}px`, md: 4 },
          // Leave room for the phone tab bar plus the home indicator.
          pb: {
            xs: `calc(${BOTTOM_NAV_HEIGHT + 16}px + env(safe-area-inset-bottom))`,
            md: 4,
          },
          "@media print": { p: 0, m: 0 },
        }}
      >
        <IMSBox sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
          <Outlet />
        </IMSBox>
      </IMSBox>

      {isMobile && <BottomNav onMoreClick={() => setDrawerOpen(true)} />}
    </IMSBox>
  );
};

export default Layout;
