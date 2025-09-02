import React, { useEffect, useState } from "react";
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
import IMSSelect from "../shared/IMSSelect";
import { useDispatch } from "react-redux";
import i18n from "../i18n/i18n";
import { useTranslation } from "react-i18next";

const Sidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [language, setLanguage] = useState("");
  const handleChangeLanguage = (event) => {
    const selectedLanguage = event.target.value;
    i18n.changeLanguage(selectedLanguage);
    setLanguage(selectedLanguage);
  };

  useEffect(() => {
    setLanguage(localStorage.getItem("i18nextLng"));
  }, [language]);

  const menuList = [
    {
      menu: t("menu.dashboard"),
      icon: <Dashboard />,
      link: "/",
    },
    {
      menu: t("menu.product"),
      icon: <Inventory />,
      link: "/product",
    },
    {
      menu: t("menu.reports"),
      icon: <Reports />,
      link: "/reports",
    },
    {
      menu: t("menu.customer"),
      icon: <Suppliers />,
      link: "/customer",
    },
    {
      menu: t("menu.orders"),
      icon: <Orders />,
      link: "/orders",
    },
  ];

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
      <IMSStack mt="auto" px={2}>
        <IMSSelect
          defaultValue={language}
          onChange={handleChangeLanguage}
          value={language}
          menu={[
            { label: "English", value: "en" },
            { label: "ગુજરાતી", value: "gu" },
          ]}
          sx={{
            "& .MuiSelect-select, & .MuiSvgIcon-root ": {
              color: "white.main",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.5) !important",
            },
          }}
        />
      </IMSStack>
    </SidebarWrapper>
  );
};

export default Sidebar;
