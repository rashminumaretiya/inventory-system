import { Box } from "@mui/system";
import React from "react";

const IMSBox = ({ children, ...props }) => {
  return <Box {...props}>{children}</Box>;
};

export default IMSBox;
