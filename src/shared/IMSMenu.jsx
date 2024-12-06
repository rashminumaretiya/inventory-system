import { Menu } from "@mui/material";
import React from "react";

const IMSMenu = ({ children, ...props }) => {
  return <Menu {...props}>{children}</Menu>;
};

export default IMSMenu;
