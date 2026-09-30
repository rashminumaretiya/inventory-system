import { AppBar } from "@mui/material";
import IMSStack from "../shared/IMSStack";
import { MUIStyled } from "../shared/MUIStyled";
import { SIDEBAR_WIDTH, surface } from "../shared/theme";

export const HeaderWrapper = MUIStyled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.white.main,
  color: theme.palette.black.main,
  boxShadow: "none",
  borderBottom: `1px solid ${surface.border}`,
  // Sits beside the permanent sidebar on desktop, full width on a phone.
  [theme.breakpoints.up("md")]: {
    left: SIDEBAR_WIDTH,
    width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
  },
  "@media print": { display: "none" },
}));

/** Light sidebar: white panel, grey icons, soft active state. */
export const SidebarWrapper = MUIStyled(IMSStack)(({ theme }) => ({
  backgroundColor: theme.palette.white.main,
  borderRight: `1px solid ${surface.border}`,
  width: SIDEBAR_WIDTH,
  height: "100%",
  // Respect the notch on a phone in landscape.
  paddingTop: "env(safe-area-inset-top)",
  "@media print": { display: "none" },
  "& .MuiList-root": {
    padding: "4px 12px",
    "& .MuiListItem-root": {
      padding: 0,
      marginBottom: 2,
      "& a": {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 8,
        color: theme.palette.text.secondary,
        textDecoration: "none",
        width: "100%",
        transition: "background-color .15s ease, color .15s ease",
        "& svg": {
          flexShrink: 0,
          width: 20,
          height: 20,
          color: theme.palette.natural.main,
        },
        "& span": {
          color: "inherit",
          lineHeight: 1.2,
          fontWeight: 500,
        },
        "&:hover": { backgroundColor: surface.subtle },
        "&.active": {
          backgroundColor: surface.subtle,
          color: theme.palette.black.main,
          "& span": { fontWeight: 600 },
          "& svg": { color: theme.palette.primary.main },
        },
      },
    },
  },
}));
