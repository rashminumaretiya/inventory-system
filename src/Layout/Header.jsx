import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, Toolbar } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import IMSBox from "../shared/IMSBox";
import IMSTypography from "../shared/IMSTypography";
import { HeaderWrapper } from "./Layout.style";
import NotificationBell from "./NotificationBell";
import { activeNavItem } from "./navigation";

/** Phone-only top bar: menu, where you are, and the bell. */
const Header = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const current = activeNavItem(pathname);

  return (
    <HeaderWrapper position="fixed" elevation={0}>
      <Toolbar disableGutters sx={{ minHeight: 56, px: 1, gap: 0.5 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          aria-label={t("description.openMenu")}
        >
          <MenuIcon />
        </IconButton>
        <IMSTypography variant="h6" noWrap sx={{ fontSize: "1.05rem" }}>
          {current ? t(current.labelKey) : t("menu.dashboard")}
        </IMSTypography>
        <IMSBox sx={{ ml: "auto" }} />
        <NotificationBell />
      </Toolbar>
    </HeaderWrapper>
  );
};

export default Header;
