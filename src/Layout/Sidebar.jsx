import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { ReactComponent as Logo } from "../assets/logo.svg";
import i18n from "../i18n/i18n";
import IMSBox from "../shared/IMSBox";
import IMSButton from "../shared/IMSButton";
import IMSList from "../shared/IMSList";
import IMSListItem from "../shared/IMSListItem";
import IMSSelect from "../shared/IMSSelect";
import IMSStack from "../shared/IMSStack";
import IMSTypography from "../shared/IMSTypography";
import { surface } from "../shared/theme";
import { useAlertCounts } from "../utils/NotificationsContext";
import { useAuth } from "../utils/AuthContext";
import { SidebarWrapper } from "./Layout.style";
import NotificationBell from "./NotificationBell";
import { itemsInGroup, navGroups } from "./navigation";

/** "en-GB" and "en-US" both mean English as far as the picker is concerned. */
const baseLanguage = (tag) => (String(tag || "").startsWith("gu") ? "gu" : "en");

const Sidebar = ({ onNavigate, showBell }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const counts = useAlertCounts();
  const { lock } = useAuth();
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
      {/* A teal band, the same teal the logo sits on, across the full width.
          It also takes the notch space on phones, so the teal reaches the top. */}
      <IMSStack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          px: 2,
          pb: 1.75,
          pt: "calc(14px + env(safe-area-inset-top))",
          bgcolor: "primary.main",
          // The bell sits on teal here, so it is white.
          "& .MuiIconButton-root": { color: "white.main" },
        }}
      >
        <IMSBox
          sx={{
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            // Sized to the logo's own 2.7:1 shape so the wordmark reads.
            "& svg": { width: 120, height: 44, display: "block" },
          }}
        >
          <Logo />
        </IMSBox>
        <IMSBox sx={{ flex: 1 }} />
        {/* On desktop there is no top bar, so the bell lives here. */}
        {showBell && <NotificationBell />}
      </IMSStack>

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
        <IMSButton
          fullWidth
          variant="outlined"
          color="black"
          startIcon={<LockOutlinedIcon />}
          onClick={lock}
          sx={{ mb: 1.5 }}
        >
          {t("buttonText.lockNow")}
        </IMSButton>
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
