import { ButtonBase, InputAdornment, Tooltip } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

import { useTypingMode } from "../utils/typingMode";

/**
 * "અ" / "A" inside a free-text field: shows which script the next key types,
 * and flips it for every field at once. Hidden unless the app is in Gujarati.
 */
const TypingModeToggle = ({ position = "end" }) => {
  const { t } = useTranslation();
  const { uiGujarati, gujaratiTyping, toggle } = useTypingMode();

  if (!uiGujarati) return null;

  return (
    <InputAdornment position={position} sx={{ mx: 0.25 }}>
      {/* describeChild: the tooltip describes the state; the button keeps its own name. */}
      <Tooltip
        describeChild
        title={t(gujaratiTyping ? "typing.switchToEnglish" : "typing.switchToGujarati")}
      >
        <ButtonBase
          // Keep focus in the field, so typing carries on after the switch.
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggle}
          aria-label={t("typing.toggle")}
          aria-pressed={gujaratiTyping}
          sx={{
            minWidth: 28,
            height: 26,
            px: 0.75,
            borderRadius: 1.5,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1,
            border: 1,
            borderColor: gujaratiTyping ? "primary.main" : "divider",
            bgcolor: gujaratiTyping ? "primary.light" : "transparent",
            color: gujaratiTyping ? "primary.dark" : "text.secondary",
          }}
        >
          {gujaratiTyping ? "અ" : "A"}
        </ButtonBase>
      </Tooltip>
    </InputAdornment>
  );
};

export default TypingModeToggle;
