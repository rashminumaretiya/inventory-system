import { List } from "@mui/material";
import React from "react";

const IMSList = ({ children, ...props }) => {
  return <List {...props}>{children}</List>;
};

export default IMSList;
