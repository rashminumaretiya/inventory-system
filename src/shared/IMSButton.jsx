import { Button } from "@mui/material";
import React from "react";

const IMSButton = ({ children, ...props }) => {
  return <Button {...props}>{children}</Button>;
};

export default IMSButton;
