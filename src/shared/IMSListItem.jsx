import { ListItem } from "@mui/material";
import React from "react";

const IMSListItem = ({ children, ...props }) => {
  return <ListItem {...props}>{children}</ListItem>;
};

export default IMSListItem;
