import IMSBox from "./IMSBox";
import { surface } from "./theme";

/** True on a Mac, where the search shortcut is ⌘K rather than Ctrl K. */
export const isMac = () =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");

/** "Ctrl K" or "⌘K", for hints next to the search box. */
export const searchShortcutLabel = () => (isMac() ? "⌘K" : "Ctrl K");

/**
 * A key cap, e.g. <Kbd>F9</Kbd>. Hidden from screen readers (the control it
 * sits in already has a name) and on touch screens, which have no keyboard.
 */
const Kbd = ({ children, sx }) => (
  <IMSBox
    component="kbd"
    aria-hidden
    sx={{
      fontFamily: "inherit",
      fontSize: 11,
      fontWeight: 600,
      lineHeight: "18px",
      px: 0.75,
      borderRadius: 1,
      border: `1px solid ${surface.borderStrong}`,
      borderBottomWidth: 2,
      bgcolor: "white.main",
      color: "text.secondary",
      whiteSpace: "nowrap",
      flexShrink: 0,
      "@media (hover: none)": { display: "none" },
      ...sx,
    }}
  >
    {children}
  </IMSBox>
);

export default Kbd;
