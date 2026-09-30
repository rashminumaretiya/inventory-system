import React, { useId } from "react";
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
const IMSDatePicker = ({
  formLabel,
  gutterNone,
  error,
  helperText,
  row,
  addNew,
  addClick,
  ...props
}) => {
  const generatedId = useId();
  const inputId = props.id || `${props.name || "date"}-${generatedId}`;
  return (
    <FormControl sx={{ mb: gutterNone ? 0 : 2.5 }} fullWidth>
      {formLabel && (
        <IMSFormLabel
          htmlFor={inputId}
          sx={{ minWidth: 120, maxWidth: 120, mb: 1 }}
        >
          {formLabel}
        </IMSFormLabel>
      )}
      <LocalizationProvider adapterLocale="en-gb" dateAdapter={AdapterDayjs}>
        <DatePickerStyle
          {...props}
          slotProps={{
            ...props.slotProps,
            textField: {
              id: inputId,
              error: Boolean(error),
              helperText,
              ...props.slotProps?.textField,
            },
          }}
          sx={{ width: "100%" }}
        />
      </LocalizationProvider>
    </FormControl>
  );
};

export default IMSDatePicker;
