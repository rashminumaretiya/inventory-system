import { FormLabel } from "@mui/material";

const IMSFormLabel = ({ children, ...props }) => {
  return (
    <FormLabel color="black" {...props}>
      {children}
    </FormLabel>
  );
};

export default IMSFormLabel;
