import MenuIcon from "@mui/icons-material/Menu";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { IconButton, Toolbar } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import IMSBox from "../shared/IMSBox";
import IMSTypography from "../shared/IMSTypography";
import { HeaderWrapper } from "./Layout.style";
import NavIcon from "./NavIcon";
import NotificationBell from "./NotificationBell";
import { activeNavItem, navItemByKey } from "./navigation";

/** Phone-only top bar: menu, where you are, search and the bell. */
const Header = ({ onMenuClick, onOpenSearch }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const current = activeNavItem(pathname);

  return (
    <HeaderWrapper position="fixed" elevation={0}>
      <Toolbar disableGutters sx={{ minHeight: 56, px: 1, gap: 0.75 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          aria-label={t("description.openMenu")}
        >
          <MenuIcon />
        </IconButton>
        <NavIcon item={current || navItemByKey("dashboard")} size={28} />
        <IMSTypography variant="h6" noWrap sx={{ fontSize: "1.05rem" }}>
          {current ? t(current.labelKey) : t("menu.dashboard")}
        </IMSTypography>
        <IMSBox sx={{ ml: "auto" }} />
        {onOpenSearch && (
          <IconButton onClick={onOpenSearch} aria-label={t("search.open")}>
            <SearchRoundedIcon />
          </IconButton>
        )}
        <NotificationBell />
      </Toolbar>
    </HeaderWrapper>
  );
};

export default Header;
