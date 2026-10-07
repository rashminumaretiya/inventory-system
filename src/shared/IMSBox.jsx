import { Box } from "@mui/system";

const IMSBox = ({ children, ...props }) => {
  return <Box {...props}>{children}</Box>;
};

export default IMSBox;
