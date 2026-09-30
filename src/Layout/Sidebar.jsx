import { Chip, Divider } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { ReactComponent as Logo } from "../assets/logo.svg";
import i18n from "../i18n/i18n";
import IMSBox from "../shared/IMSBox";
import IMSList from "../shared/IMSList";
import IMSListItem from "../shared/IMSListItem";
import IMSSelect from "../shared/IMSSelect";
import IMSStack from "../shared/IMSStack";
import IMSTypography from "../shared/IMSTypography";
import { surface } from "../shared/theme";
import { useAlertCounts } from "../utils/NotificationsContext";
import useSettings from "../utils/useSettings";
import { SidebarWrapper } from "./Layout.style";
import NotificationBell from "./NotificationBell";
import { itemsInGroup, navGroups } from "./navigation";

/** "en-GB" and "en-US" both mean English as far as the picker is concerned. */
const baseLanguage = (tag) => (String(tag || "").startsWith("gu") ? "gu" : "en");

const Sidebar = ({ onNavigate, showBell }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const counts = useAlertCounts();
  const [language, setLanguage] = useState(() => baseLanguage(i18n.language));

  const handleChangeLanguage = (event) => {
    const selected = event.target.value;
    i18n.changeLanguage(selected);
    setLanguage(selected);
  };

  useEffect(() => {
    const sync = (lng) => setLanguage(baseLanguage(lng));
    i18n.on("languageChanged", sync);
    return () => i18n.off("languageChanged", sync);
  }, []);

  return (
    <SidebarWrapper>
      {/* Workspace header: shop identity rather than a generic logo block. */}
      <IMSStack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: 2, py: 2 }}
      >
        <IMSBox
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: "primary.main",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            "& svg": { width: 26, height: 26 },
          }}
        >
          <Logo />
        </IMSBox>
        <IMSStack sx={{ minWidth: 0, flex: 1 }}>
          <IMSTypography fontWeight={700} noWrap lineHeight={1.2}>
            {settings.shopName}
          </IMSTypography>
          <IMSTypography variant="caption" color="natural.main" noWrap>
            {t("description.appTagline")}
          </IMSTypography>
        </IMSStack>
        {/* On desktop there is no top bar, so the bell lives here. */}
        {showBell && <NotificationBell />}
      </IMSStack>
      <Divider />

      <IMSBox sx={{ overflowY: "auto", flex: 1, py: 1 }}>
        {navGroups.map((group) => (
          <IMSBox key={group.key}>
            <IMSTypography
              variant="caption"
              sx={{
                display: "block",
                px: 3,
                pt: 1.5,
                pb: 0.5,
                color: "natural.main",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {t(group.titleKey)}
            </IMSTypography>
            <IMSList>
              {itemsInGroup(group.key).map((item) => {
                const badge = item.badge ? counts[item.badge] : 0;
                return (
                  <IMSListItem key={item.key}>
                    <Link
                      to={item.link}
                      className={
                        location.pathname === item.link ? "active" : ""
                      }
                      // On a phone the sidebar is a drawer, so it should close
                      // once a destination is chosen.
                      onClick={onNavigate}
                    >
                      <item.Icon />
                      <IMSTypography component="span">
                        {t(item.labelKey)}
                      </IMSTypography>
                      {badge > 0 && (
                        <Chip
                          size="small"
                          label={badge}
                          color={item.badge === "orders" ? "error" : "warning"}
                          sx={{
                            ml: "auto",
                            height: 20,
                            minWidth: 20,
                            "& .MuiChip-label": { px: 0.75, fontSize: 11 },
                          }}
                        />
                      )}
                    </Link>
                  </IMSListItem>
                );
              })}
            </IMSList>
          </IMSBox>
        ))}
      </IMSBox>

      <IMSBox sx={{ borderTop: `1px solid ${surface.border}`, p: 2 }}>
        <IMSSelect
          gutterNone
          onChange={handleChangeLanguage}
          value={language}
          aria-label={t("formLabel.language")}
          menu={[
            { label: "English", value: "en" },
            { label: "ગુજરાતી", value: "gu" },
          ]}
        />
      </IMSBox>
    </SidebarWrapper>
  );
};

export default Sidebar;
