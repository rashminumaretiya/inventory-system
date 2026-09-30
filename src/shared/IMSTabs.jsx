import { Tab, Tabs } from "@mui/material";
import React from "react";

import { surface } from "./theme";

/**
 * Underlined tab row. Scrolls rather than wrapping on narrow screens, so the
 * page never grows a horizontal scrollbar of its own.
 */
const IMSTabs = ({ value, onChange, tabs = [], sx }) => (
  <Tabs
    value={value}
    onChange={(event, next) => onChange(next)}
    variant="scrollable"
    scrollButtons="auto"
    allowScrollButtonsMobile
    sx={{ borderBottom: `1px solid ${surface.border}`, mb: 1, ...sx }}
  >
    {tabs.map((tab) => (
      <Tab key={tab.value} value={tab.value} label={tab.label} />
    ))}
  </Tabs>
);

export default IMSTabs;
