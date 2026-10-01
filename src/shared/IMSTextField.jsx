import { FormControl, TextField as TF } from "@mui/material";
import { useCallback, useEffect, useId, useRef } from "react";

import attachTransliteration from "../utils/attachTransliteration";
import { isGujaratiTyping } from "../utils/typingMode";
import TypingModeToggle from "./TypingModeToggle";
import { MUIStyled } from "./MUIStyled";
import IMSFormLabel from "./IMSFormLabel";

const TextField = MUIStyled(TF)(({ theme, bgColor }) => ({
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

const IMSTextField = ({
  // Layout-only props: these must not reach the DOM input.
  formLabel,
  row,
  gutterNone,
  addNew,
  addClick,
  // Free text that should type Gujarati while the app is in Gujarati.
  transliterate,
  inputRef: callerInputRef,
  InputProps,
  ...props
}) => {
  const generatedId = useId();
  // Linking label to input gives the field an accessible name, so screen
  // readers announce it and clicking the label focuses the input.
  const inputId = props.id || `${props.name || "field"}-${generatedId}`;

  const ownRef = useRef(null);
  const inputRef = useCallback(
    (node) => {
      ownRef.current = node;
      if (typeof callerInputRef === "function") callerInputRef(node);
      else if (callerInputRef) callerInputRef.current = node;
    },
    [callerInputRef]
  );

  useEffect(() => {
    if (!transliterate) return undefined;
    return attachTransliteration(ownRef.current, isGujaratiTyping);
  }, [transliterate]);

  /**
   * The અ/A switch goes in whichever adornment slot is free: the end for a
   * plain field, the start for an Autocomplete (whose end holds its buttons).
   */
  const mergedInputProps = { ...InputProps };
  if (transliterate) {
    if (!InputProps?.endAdornment) {
      mergedInputProps.endAdornment = <TypingModeToggle position="end" />;
    } else if (!InputProps?.startAdornment) {
      mergedInputProps.startAdornment = <TypingModeToggle position="start" />;
    }
  }

  return (
    <FormControl
      fullWidth
      sx={{
        display: "flex",
        flexDirection: row ? "row" : "column",
        alignItems: row ? "center" : "flex-start",
        mb: gutterNone ? 0 : 2.5,
      }}
    >
      {formLabel && (
        <IMSFormLabel
          htmlFor={inputId}
          sx={{ minWidth: 120, mb: !row ? 0.5 : 0 }}
        >
          {formLabel}
        </IMSFormLabel>
      )}
      <TextField
        fullWidth
        sx={{ flex: 1, ml: row ? 2 : 0 }}
        {...props}
        InputProps={mergedInputProps}
        inputRef={inputRef}
        id={inputId}
      />
    </FormControl>
  );
};

export default IMSTextField;
