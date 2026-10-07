import { Menu } from "@mui/material";

const IMSMenu = ({ children, ...props }) => {
  return <Menu {...props}>{children}</Menu>;
};

export default IMSMenu;
