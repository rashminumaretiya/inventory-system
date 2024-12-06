import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4862D7",
      dark: "#3047B4",
      light: "#E8E8E8",
    },
    secondary: {
      main: "#DEEAFA",
    },
    error: {
      main: "#FF5656",
    },
    natural: {
      main: "#858D9D",
    },
    info: {
      main: "#C8DCFB",
    },
    black: {
      main: "#0B1019",
    },
    white: {
      main: "#fff",
    },
    orange: {
      main: "#FDA624",
    },
    success: {
      main: "#27ae60",
    },
    warning: {
      main: "#fbf3dd",
    },
  },
  typography: {
    fontFamily: '"Roboto", sans-serif',
    body1: {
      color: "rgba(0, 0, 0, 0.87)",
    },
  },
});
export default theme;
