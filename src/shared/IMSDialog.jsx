import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const IMSDialog = ({
  title,
  open,
  children,
  handleClose,
  hideClose,
  ...props
}) => {
  const theme = useTheme();
  // A form in a small floating box is awkward on a phone; take the screen.
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      fullScreen={fullScreen}
      {...props}
    >
      {title && (
        <DialogTitle sx={{ pr: 6, fontSize: { xs: "1.05rem", sm: "1.25rem" } }}>
          {title}
        </DialogTitle>
      )}
      {!hideClose && (
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(t) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: t.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
      )}
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default IMSDialog;
