import IMSBox from "./IMSBox";
import { DESKTOP_PAGE_GUTTER } from "./theme";

const height = (unit) => `calc(100${unit} - ${DESKTOP_PAGE_GUTTER * 2}px)`;

/** Exactly the space left inside the desktop page gutters. */
export const fullPageHeight = {
  height: height("vh"),
  "@supports (height: 100dvh)": { height: height("dvh") },
};

/**
 * On desktop, fills the viewport as a column so a list's table can stretch to
 * the bottom and scroll inside itself, with nothing below it but pagination.
 * On a phone it does nothing: those screens show cards, and the page scrolls.
 */
const FullHeightPage = ({ children }) => (
  <IMSBox
    sx={(theme) => ({
      [theme.breakpoints.up("md")]: {
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        ...fullPageHeight,
      },
    })}
  >
    {children}
  </IMSBox>
);

export default FullHeightPage;
