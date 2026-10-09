import { Button } from "@mui/material";
import { MUIStyled } from "./MUIStyled";

const StyledButton = MUIStyled(Button)(({ theme }) => ({
  padding: "8px 18px",
  [theme.breakpoints.down("sm")]: {
    padding: "6px 12px",
    "& .MuiButton-startIcon": { marginRight: 4 },
  },
}));

const IMSButton = ({ children, ...props }) => {
  return (
    <StyledButton disableElevation {...props}>
      {children}
    </StyledButton>
  );
};

export default IMSButton;
