import { MenuItem } from "@mui/material";

const IMSMenuItem = ({ children, ...props }) => {
  return <MenuItem {...props}>{children}</MenuItem>;
};

export default IMSMenuItem;
