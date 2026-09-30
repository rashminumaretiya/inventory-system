import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { IconButton } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

import IMSStack from "./IMSStack";
import IMSTypography from "./IMSTypography";
import { surface } from "./theme";

/**
 * Minus / quantity / plus. Lets a shopkeeper correct a line by tapping rather
 * than deleting the row and typing it again.
 */
const QuantityStepper = ({ quantity, unit, onStep, size = "small" }) => {
  const { t } = useTranslation();
  const button = {
    border: `1px solid ${surface.borderStrong}`,
    borderRadius: 1.5,
    p: size === "small" ? 0.25 : 0.5,
  };

  return (
    <IMSStack direction="row" alignItems="center" spacing={0.75}>
      <IconButton
        size={size}
        sx={button}
        aria-label={t("buttonText.decrease")}
        onClick={(event) => {
          event.stopPropagation();
          onStep(-1);
        }}
      >
        <RemoveIcon fontSize="inherit" />
      </IconButton>
      <IMSTypography
        component="span"
        sx={{ minWidth: 62, textAlign: "center", fontWeight: 600 }}
      >
        {quantity}{" "}
        <IMSTypography component="span" variant="body2" color="natural.main">
          {unit}
        </IMSTypography>
      </IMSTypography>
      <IconButton
        size={size}
        sx={button}
        aria-label={t("buttonText.increase")}
        onClick={(event) => {
          event.stopPropagation();
          onStep(1);
        }}
      >
        <AddIcon fontSize="inherit" />
      </IconButton>
    </IMSStack>
  );
};

export default QuantityStepper;
