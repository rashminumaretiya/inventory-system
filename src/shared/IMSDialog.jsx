import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import React from "react";
import CloseIcon from "@mui/icons-material/Close";

const IMSDialog = ({ title, open, children, handleClose,hideClose, ...props }) => {
  return (
    <Dialog open={open} onClose={handleClose} fullWidth {...props}>
      {title && <DialogTitle>{title}</DialogTitle>}
      {
        !hideClose && 
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
      }
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
};

export default IMSDialog;
