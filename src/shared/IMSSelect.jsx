import { FormControl, Select } from "@mui/material";
import React from "react";
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
const IMSSelect = ({ menu, formLabel, ...props }) => {
  return (
    <FormControl
      fullWidth
      sx={{
        display: "flex",
        flexDirection: props.row ? "row" : "column",
        alignItems: props.row ? "center" : "flex-start",
        mb: props.gutterNone ? 0 : 2.5,
      }}
    >
      {formLabel && (
        <IMSFormLabel
          sx={{ minWidth: 120, maxWidth: 120, mb: !props.row ? 0.5 : 0 }}
        >
          {formLabel}
        </IMSFormLabel>
      )}
      <SelectStyle fullWidth {...props}>
        {menu?.map((item, i) => (
          <IMSMenuItem key={i} value={item.value ? item.value : item}>
            {item.label ? item.label : item}
          </IMSMenuItem>
        ))}
      </SelectStyle>
    </FormControl>
  );
};

export default IMSSelect;
