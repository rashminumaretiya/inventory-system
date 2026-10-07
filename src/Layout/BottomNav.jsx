import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { BOTTOM_NAV_HEIGHT } from "../shared/theme";
import { primaryNavItems } from "./navigation";

/**
 * Phone-only tab bar for the destinations used most during a shift. Everything
 * else is behind "More", which opens the drawer.
 */
const BottomNav = ({ onMoreClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const current = primaryNavItems.some((item) => item.link === pathname)
    ? pathname
    : false;

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: "1px solid #e6eaea",
        borderRadius: 0,
        // Keep the bar clear of the iPhone home indicator.
        pb: "env(safe-area-inset-bottom)",
        "@media print": { display: "none" },
      }}
    >
      <BottomNavigation
        showLabels
        value={current}
        sx={{ height: BOTTOM_NAV_HEIGHT, bgcolor: "transparent" }}
      >
        {primaryNavItems.map((item) => (
          <BottomNavigationAction
            key={item.key}
            value={item.link}
            label={t(item.shortLabelKey || item.labelKey)}
            icon={<item.Icon />}
            onClick={() => navigate(item.link)}
            sx={{
              minWidth: 0,
              px: 0.5,
              "& .MuiBottomNavigationAction-label": { fontSize: 11 },
            }}
          />
        ))}
        <BottomNavigationAction
          label={t("description.more")}
          icon={<MoreHorizIcon />}
          onClick={onMoreClick}
          sx={{
            minWidth: 0,
            px: 0.5,
            "& .MuiBottomNavigationAction-label": { fontSize: 11 },
          }}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
