import { Autocomplete } from "@mui/material";
import React from "react";
import IMSTextField from "./IMSTextField";
import IMSTypography from "./IMSTypography";

const IMSAutoComplete = ({
  formLabel,
  row,
  options,
  name,
  value,
  onChange,
  inputValue,
  onInputChange,
  error,
  helperText,
  addNew,
  addClick,
}) => {
  return (
    <>
      {addNew && (
        <IMSTypography
          onClick={addClick}
          sx={{
            cursor: "pointer",
            float: "right",
            mb: -3,
            position: "relative",
            zIndex: 1,
          }}
          variant="body2"
          color="primary"
        >
          {addNew}
        </IMSTypography>
      )}
      <Autocomplete
        options={options}
        onChange={onChange}
        inputValue={inputValue}
        onInputChange={onInputChange}
        value={value}
        renderInput={(params) => (
          <IMSTextField
            row={row}
            formLabel={formLabel}
            addNew={addNew}
            {...params}
            variant="outlined"
            name={name}
            error={error}
            helperText={helperText}
          />
        )}
        sx={{ flex: 1 }}
      />
    </>
  );
};

export default IMSAutoComplete;
