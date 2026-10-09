import { Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import IMSBox from "../shared/IMSBox";
import {
  BOTTOM_NAV_HEIGHT,
  DESKTOP_PAGE_GUTTER,
  SIDEBAR_WIDTH,
} from "../shared/theme";
import BottomNav from "./BottomNav";
import Header from "./Header";
import QuickSearch from "./QuickSearch";
import Sidebar from "./Sidebar";
import useSearchShortcut from "./useSearchShortcut";

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();

  // Never leave the drawer open behind a new screen.
  useEffect(() => setDrawerOpen(false), [pathname]);

  const openSearch = useCallback(() => {
    setDrawerOpen(false);
    setSearchOpen(true);
  }, []);
  useSearchShortcut(openSearch);

  return (
    <IMSBox sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop needs no top bar: the sidebar carries identity and the bell,
          and each page opens with its own title. */}
      {isMobile && (
        <Header
          onMenuClick={() => setDrawerOpen(true)}
          onOpenSearch={openSearch}
        />
      )}

      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: SIDEBAR_WIDTH, border: 0 } }}
        >
          <Sidebar
            onNavigate={() => setDrawerOpen(false)}
            onOpenSearch={openSearch}
          />
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
          <Sidebar showBell onOpenSearch={openSearch} />
        </Drawer>
      )}

      <IMSBox
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 1, sm: 2.5, md: 3 },
          pt: { xs: `${56 + 16}px`, md: `${DESKTOP_PAGE_GUTTER}px` },
          // Leave room for the phone tab bar plus the home indicator.
          pb: {
            xs: `calc(${BOTTOM_NAV_HEIGHT + 16}px + env(safe-area-inset-bottom))`,
            md: `${DESKTOP_PAGE_GUTTER}px`,
          },
          "@media print": { p: 0, m: 0 },
        }}
      >
        {/* The till uses the full width; list screens stay readable at 1400. */}
        <IMSBox>
          <Outlet />
        </IMSBox>
      </IMSBox>

      {isMobile && <BottomNav onMoreClick={() => setDrawerOpen(true)} />}

      <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </IMSBox>
  );
};

export default Layout;
