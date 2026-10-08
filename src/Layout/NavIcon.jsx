import { alpha } from "@mui/material";

import IMSBox from "../shared/IMSBox";

/**
 * A menu icon on a soft tile in the item's own colour. The active item gets a
 * solid tile and the filled glyph, so "where am I" reads at a glance.
 */
const NavIcon = ({ item, active = false, size = 32 }) => {
  const Glyph = active ? item.ActiveIcon : item.Icon;
  const glyph = Math.round(size * 0.6);

  return (
    <IMSBox
      aria-hidden
      className="nav-icon"
      sx={{
        width: size,
        height: size,
        borderRadius: `${Math.round(size * 0.3)}px`,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: active ? "#fff" : item.tint,
        bgcolor: active ? item.tint : alpha(item.tint, 0.12),
        transition: "background-color .15s ease, color .15s ease",
        "& svg": { width: glyph, height: glyph, color: "inherit" },
      }}
    >
      <Glyph />
    </IMSBox>
  );
};

export default NavIcon;
