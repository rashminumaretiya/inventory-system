import { AppBar } from "@mui/material";
import IMSStack from "../shared/IMSStack";
import { MUIStyled } from "../shared/MUIStyled";

export const HeaderWrapper = MUIStyled(AppBar)(({ theme }) => ({
  boxShadow: "0 0 5px rgba(0,0,0,0.2)",
  left: 240,
  padding: "10px 20px",
  flexDirection: "row",
  width: "auto",
  "& .MuiFormControl-root": {
    maxWidth: 450,
    width: "100%",
  },
  "@media print": {
    display: "none",
  },
}));
export const SidebarWrapper = MUIStyled(IMSStack)(({ theme }) => ({
  background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  position: "fixed",
  left: 0,
  top: 0,
  bottom: 0,
  width: 240,
  "@media print": {
    display: "none",
  },
  "& .MuiList-root": {
    "& .MuiListItem-root": {
      padding: 0,
      marginBottom: 10,
      "& a": {
        padding: "8px 15px",
        color: theme.palette.white.main,
        textDecoration: "none",
        width: "100%",
        "& svg": {
          verticalAlign: "middle",
          width: 30,
          height: 22,
          marginRight: 8,
        },
        "& span": {
          verticalAlign: "middle",
          color: theme.palette.white.main,
        },
        "&.active": {
          backgroundColor: "rgba(255, 255, 255,0.2)",
        },
      },
    },
  },
}));
