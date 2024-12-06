import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import React from "react";
import IMSFormLabel from "./IMSFormLabel";

const IMSRadioGroup = ({ list, ...props }) => {
  return (
    <FormControl sx={{ mb: 2.5 }}>
      <IMSFormLabel>{props.formLabel}</IMSFormLabel>
      <RadioGroup
        sx={{ mt: 0.5 }}
        row
        defaultValue={props.defaultValue}
        name={props.name}
      >
        {list.map((item, i) => (
          <FormControlLabel
            key={i}
            value={item.value}
            control={<Radio />}
            label={item.label}
            onChange={props.onChange}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

export default IMSRadioGroup;
