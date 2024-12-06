import { Avatar, Box, IconButton, InputAdornment } from "@mui/material";
import React, { useState } from "react";
import IMSMenu from "../shared/IMSMenu";
import IMSMenuItem from "../shared/IMSMenuItem";
import IMSTypography from "../shared/IMSTypography";
import { HeaderWrapper } from "./Layout.style";
import IMSTextField from "../shared/IMSTextField";
import { Search } from "../shared/icon";
import { NotificationsOutlined } from "@mui/icons-material";

const settings = ["Profile", "Account", "Dashboard", "Logout"];
const Header = () => {
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  return (
    <HeaderWrapper position="fixed" color="white" elevation={0}>
      <IMSTextField
        variant="outlined"
        placeholder="Search product, supplier, order"
        gutterNone
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ ml: "auto" }}>
        <IconButton>
          <NotificationsOutlined />
        </IconButton>
        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 2 }}>
          <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
        </IconButton>
        <IMSMenu
          sx={{ mt: "45px" }}
          anchorEl={anchorElUser}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
        >
          {settings.map((setting) => (
            <IMSMenuItem key={setting} onClick={handleCloseUserMenu}>
              <IMSTypography>{setting}</IMSTypography>
            </IMSMenuItem>
          ))}
        </IMSMenu>
      </Box>
    </HeaderWrapper>
  );
};

export default Header;
