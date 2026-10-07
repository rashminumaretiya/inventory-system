import { ListItem } from "@mui/material";

const IMSListItem = ({ children, ...props }) => {
  return <ListItem {...props}>{children}</ListItem>;
};

export default IMSListItem;
