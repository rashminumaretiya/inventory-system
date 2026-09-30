import { createTheme, responsiveFontSizes } from "@mui/material";

/** Neutral surface tokens, so panels and tables share one set of greys. */
export const surface = {
  page: "#ffffff",
  subtle: "#F9FAFB",
  border: "#E9EAEB",
  borderStrong: "#D5D7DA",
};

const palette = {
  primary: {
    main: "#007881",
    dark: "#00565C",
    light: "#E6F2F3",
  },
  secondary: {
    main: "#DEEAFA",
  },
  error: {
    main: "#D92D20",
    light: "#FEF3F2",
  },
  natural: {
    main: "#717680",
  },
  info: {
    main: "#C8DCFB",
  },
  black: {
    main: "#181D27",
  },
  white: {
    main: "#fff",
  },
  orange: {
    main: "#DC6803",
    light: "#FFFAEB",
  },
  success: {
    main: "#067647",
    light: "#ECFDF3",
    contrastText: "#fff",
  },
  warning: {
    main: "#B54708",
    light: "#FFFAEB",
  },
  divider: surface.border,
  background: {
    default: surface.page,
    paper: "#fff",
  },
  text: {
    primary: "#181D27",
    secondary: "#535862",
  },
};

/** Shared layout constants so the sidebar, header and content stay in step. */
export const SIDEBAR_WIDTH = 260;
export const HEADER_HEIGHT = 68;
export const BOTTOM_NAV_HEIGHT = 60;

let theme = createTheme({
  palette,
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Mukta Vaani", sans-serif',
    body1: { color: palette.text.primary },
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { WebkitTextSizeAdjust: "100%" },
        body: { backgroundColor: surface.page },
        "#root": { minHeight: "100%" },
        "@media print": { body: { backgroundColor: "#fff" } },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 8,
          // Comfortable tap target on a phone.
          minHeight: 44,
          [t.breakpoints.up("md")]: { minHeight: 40 },
        }),
        outlined: { borderColor: surface.borderStrong },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          [t.breakpoints.down("md")]: { padding: 10 },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 16 },
        // Soft pill chips, as in the reference design.
        filledSuccess: {
          backgroundColor: palette.success.light,
          color: palette.success.main,
        },
        filledError: {
          backgroundColor: palette.error.light,
          color: palette.error.main,
        },
        filledWarning: {
          backgroundColor: palette.warning.light,
          color: palette.warning.main,
        },
        filledPrimary: {
          backgroundColor: palette.primary.light,
          color: palette.primary.dark,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${surface.border}`, borderRadius: 12 },
      },
    },
    MuiTooltip: { defaultProps: { enterTouchDelay: 0 } },
    MuiOutlinedInput: {
      styleOverrides: {
        input: ({ theme: t }) => ({
          // 16px prevents the automatic zoom-in on iOS Safari.
          [t.breakpoints.down("md")]: { fontSize: 16 },
        }),
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { "& .MuiTableCell-root": { backgroundColor: surface.subtle } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          whiteSpace: "nowrap",
          borderBottom: `1px solid ${surface.border}`,
        },
        head: { color: palette.text.secondary, fontWeight: 600 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          minHeight: 40,
          color: palette.text.secondary,
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
