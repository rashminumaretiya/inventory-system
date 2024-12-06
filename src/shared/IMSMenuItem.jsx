import { MenuItem } from "@mui/material";
import React from "react";

const IMSMenuItem = ({ children, ...props }) => {
  return <MenuItem {...props}>{children}</MenuItem>;
};

export default IMSMenuItem;
