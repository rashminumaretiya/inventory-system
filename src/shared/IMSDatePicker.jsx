import React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { FormControl } from "@mui/material";
import IMSFormLabel from "./IMSFormLabel";
import { MUIStyled } from "./MUIStyled";
import 'dayjs/locale/en-gb';

const DatePickerStyle = MUIStyled(DatePicker)(({ theme }) => ({
  "& .MuiOutlinedInput-notchedOutline": {
    border: "1px solid #e3e3e3",
  },
  "& .MuiInputBase-input": {
    padding: 9,
  },
}));
const IMSDatePicker = ({ ...props }) => {
  return (
    <FormControl
      sx={{
        mb: props.gutterNone ? 0 : 2.5,
      }}
      fullWidth
    >
      {props.formLabel && (
        <IMSFormLabel sx={{ minWidth: 120, maxWidth: 120, mb: 1 }}>
          {props.formLabel}
        </IMSFormLabel>
      )}
      <LocalizationProvider adapterLocale="en-gb" dateAdapter={AdapterDayjs}>
        <DatePickerStyle {...props} sx={{ width: "100%" }} />
      </LocalizationProvider>
    </FormControl>
  );
};

export default IMSDatePicker;
