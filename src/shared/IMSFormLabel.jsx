import { FormLabel } from "@mui/material";
import React from "react";

const IMSFormLabel = ({ children, ...props }) => {
  return (
    <FormLabel color="black" {...props}>
      {children}
    </FormLabel>
  );
};

export default IMSFormLabel;
