import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
} from "@mui/material";
import IMSFormLabel from "./IMSFormLabel";

/**
 * Controlled when `value` is supplied, so the billing form no longer needs to
 * remount itself with a `key` to reflect a GST change.
 */
const IMSRadioGroup = ({
  list = [],
  formLabel,
  name,
  value,
  defaultValue,
  onChange,
  error,
  helperText,
  // Layout-only props; forwarding these would put them on the DOM node.
  row,
  gutterNone,
  addNew,
  addClick,
  multiline,
  rows,
  inputProps,
  ...props
}) => {
  const isControlled = value !== undefined;
  return (
    <FormControl sx={{ mb: 2.5 }} error={Boolean(error)}>
      {formLabel && <IMSFormLabel>{formLabel}</IMSFormLabel>}
      <RadioGroup
        sx={{ mt: 0.5 }}
        row
        name={name}
        onChange={onChange}
        {...(isControlled ? { value } : { defaultValue })}
        {...props}
      >
        {list.map((item, i) => (
          <FormControlLabel
            key={i}
            value={item.value}
            control={<Radio />}
            label={item.label}
          />
        ))}
      </RadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default IMSRadioGroup;
