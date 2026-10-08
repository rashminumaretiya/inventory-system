import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import IMSBox from "../shared/IMSBox";
import { BOTTOM_NAV_HEIGHT } from "../shared/theme";
import { primaryNavItems } from "./navigation";

/** Shared look of every tab: compact label, icon on a pill when selected. */
const tabSx = {
  minWidth: 0,
  px: 0.5,
  pt: 0.75,
  "& .MuiBottomNavigationAction-label": { fontSize: 11, mt: 0.25 },
  "& .MuiBottomNavigationAction-label.Mui-selected": {
    fontSize: 11,
    fontWeight: 700,
  },
  "& .tab-pill": {
    width: 52,
    height: 28,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    transition: "background-color .2s ease",
    "& svg": { fontSize: 22 },
  },
  "&.Mui-selected .tab-pill": { bgcolor: "primary.light" },
};

/**
 * Phone-only tab bar for the destinations used most during a shift. Everything
 * else is behind "More", which opens the drawer. Tabs show the outlined icon;
 * the current one gets the filled icon on a soft pill.
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
        {primaryNavItems.map((item) => {
          const Glyph = current === item.link ? item.ActiveIcon : item.Icon;
          return (
            <BottomNavigationAction
              key={item.key}
              value={item.link}
              label={t(item.shortLabelKey || item.labelKey)}
              icon={
                <IMSBox className="tab-pill">
                  <Glyph />
                </IMSBox>
              }
              onClick={() => navigate(item.link)}
              sx={tabSx}
            />
          );
        })}
        <BottomNavigationAction
          label={t("description.more")}
          icon={
            <IMSBox className="tab-pill">
              <GridViewOutlinedIcon />
            </IMSBox>
          }
          onClick={onMoreClick}
          sx={tabSx}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
