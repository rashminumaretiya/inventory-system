import { Typography } from "@mui/material";

const IMSTypography = ({ children, ...props }) => {
  return <Typography {...props}>{children}</Typography>;
};

export default IMSTypography;
