import { Stack } from "@mui/system";

const IMSStack = ({ children, ...props }) => {
  return <Stack {...props}>{children}</Stack>;
};

export default IMSStack;
