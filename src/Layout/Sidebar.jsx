import React from "react";
import AdbIcon from "@mui/icons-material/Adb";
import IMSList from "../shared/IMSList";
import IMSListItem from "../shared/IMSListItem";
import { Link, useLocation } from "react-router-dom";
import {
  Dashboard,
  Inventory,
  Orders,
  Reports,
  Suppliers,
} from "../shared/icon";
import { SidebarWrapper } from "./Layout.style";
import IMSTypography from "../shared/IMSTypography";
import IMSStack from "../shared/IMSStack";

const menuList = [
  {
    menu: "Dashboard",
    icon: <Dashboard />,
    link: "/",
  },
  {
    menu: "Inventory",
    icon: <Inventory />,
    link: "/inventory",
  },
  {
    menu: "Reports",
    icon: <Reports />,
    link: "/reports",
  },
  {
    menu: "Suppliers",
    icon: <Suppliers />,
    link: "/suppliers",
  },
  {
    menu: "Orders",
    icon: <Orders />,
    link: "/orders",
  },
];

const Sidebar = () => {
  const location = useLocation();
  return (
    <SidebarWrapper>
      <IMSStack direction="row" alignItems="center" p={2} color="white.main">
        <AdbIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
        <IMSTypography variant="h6">Logo</IMSTypography>
      </IMSStack>
      <IMSList>
        {menuList.map((item, i) => {
          return (
            <IMSListItem key={i}>
              <Link
                to={item.link}
                className={location.pathname === item.link ? "active" : ""}
              >
                {item.icon}
                <IMSTypography component="span">{item.menu}</IMSTypography>
              </Link>
            </IMSListItem>
          );
        })}
      </IMSList>
    </SidebarWrapper>
  );
};

export default Sidebar;
