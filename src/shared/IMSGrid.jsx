import { Grid } from "@mui/material";

const IMSGrid = ({ children, ...props }) => {
  return <Grid {...props}>{children}</Grid>;
};

export default IMSGrid;
