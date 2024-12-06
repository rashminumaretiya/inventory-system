import { Stack } from "@mui/system";
import React from "react";

const IMSStack = ({ children, ...props }) => {
  return <Stack {...props}>{children}</Stack>;
};

export default IMSStack;
