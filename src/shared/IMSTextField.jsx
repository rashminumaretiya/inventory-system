import { FormControl, TextField as TF } from "@mui/material";
import React from "react";
import { MUIStyled } from "./MUIStyled";
import IMSFormLabel from "./IMSFormLabel";

const TextField = MUIStyled(TF)(({ theme, position, bgColor }) => ({
  marginTop: 0,
  marginBottom: 0,
  "& .MuiOutlinedInput-root": {
    borderRadius: 6,
    overflow: "hidden",
    "&.Mui-disabled": {
      backgroundColor: "#fafafa",
      "& .MuiInputBase-input": {
        color: theme.palette.black.main,
        WebkitTextFillColor: theme.palette.black.main,
      },
    },
    "&.Mui-error": {
      borderColor: theme.palette.error.main,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "1px solid #e3e3e3",
    },
    "& .MuiInputBase-input": {
      padding: 9,
      [theme.breakpoints.down("sm")]: {
        padding: "10px 14px",
      },
      "&.MuiAutocomplete-input": {
        padding: 0,
      },
      '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button, &[type="number"]':
        {
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        },
      "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus":
        {
          WebkitBoxShadow: `0 0 0px 40rem ${
            bgColor || theme.palette.white.main
          } inset`,
          borderRadius: 6,
        },
      "&::-webkit-input-placeholder": {
        color: theme.palette.black.main,
      },
      "&:-ms-input-placeholder": {
        color: theme.palette.black.main,
      },
      "&::placeholder": {
        color: theme.palette.black.main,
      },
    },
    "&:before, &:after": {
      content: "normal",
    },
    "&.MuiInputBase-multiline": {
      padding: 0,
      "& textarea": {
        resize: "vertical",
      },
    },
  },
  "& .MuiFormHelperText-root": {
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    "& svg": {
      width: 15,
      height: 15,
      verticalAlign: "middle",
    },
    "&.Mui-error": {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
    },
  },
}));

const IMSTextField = ({ ...props }) => {
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
      {props.formLabel && (
        <IMSFormLabel
          sx={{ minWidth: 120, maxWidth: 120, mb: !props.row ? 0.5 : 0 }}
        >
          {props.formLabel}
        </IMSFormLabel>
      )}
      <TextField fullWidth sx={{ flex: 1, ml: props.row ? 2 : 0 }} {...props} />
    </FormControl>
  );
};

export default IMSTextField;
