import { List } from "@mui/material";

const IMSList = ({ children, ...props }) => {
  return <List {...props}>{children}</List>;
};

export default IMSList;
