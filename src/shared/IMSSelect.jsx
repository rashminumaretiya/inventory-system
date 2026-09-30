import { FormControl, Select } from "@mui/material";
import React, { useId } from "react";
import IMSFormLabel from "./IMSFormLabel";
import { MUIStyled } from "./MUIStyled";
import IMSMenuItem from "./IMSMenuItem";

const SelectStyle = MUIStyled(Select)(({ theme }) => ({
  "& .MuiSelect-outlined": {
    padding: 9,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#e3e3e3",
  },
}));
const IMSSelect = ({
  menu,
  formLabel,
  helperText,
  error,
  // Layout-only props, as above.
  row,
  gutterNone,
  addNew,
  addClick,
  ...props
}) => {
  const resolvedMenu = typeof menu === "function" ? menu(props) : menu;
  const generatedId = useId();
  const labelId = `${props.name || "select"}-label-${generatedId}`;
  const selectId = props.id || `${props.name || "select"}-${generatedId}`;
  return (
    <FormControl
      fullWidth
      error={Boolean(error)}
      sx={{
        display: "flex",
        flexDirection: row ? "row" : "column",
        alignItems: row ? "center" : "flex-start",
        mb: gutterNone ? 0 : 2.5,
      }}
    >
      {formLabel && (
        <IMSFormLabel
          id={labelId}
          htmlFor={selectId}
          sx={{ minWidth: 120, maxWidth: 120, mb: !row ? 0.5 : 0 }}
        >
          {formLabel}
        </IMSFormLabel>
      )}
      <SelectStyle
        fullWidth
        {...props}
        id={selectId}
        // A select with no visible label still needs a name for assistive
        // technology; the unit picker beside Item Quantity is one.
        inputProps={{
          "aria-label": formLabel ? undefined : props["aria-label"],
          ...props.inputProps,
        }}
        {...(formLabel ? { labelId } : {})}
      >
        {resolvedMenu?.map((item, i) => (
          <IMSMenuItem
            key={i}
            value={item.value ? item.value : item}
            disabled={item?.disabled}
          >
            {item.label ? item.label : item}
          </IMSMenuItem>
        ))}
      </SelectStyle>
    </FormControl>
  );
};

export default IMSSelect;
