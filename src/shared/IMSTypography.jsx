import { Typography } from "@mui/material";
import React from "react";

const IMSTypography = ({ children, ...props }) => {
  return <Typography {...props}>{children}</Typography>;
};

export default IMSTypography;
