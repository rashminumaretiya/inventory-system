import CloseIcon from "@mui/icons-material/Close";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Badge,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import IMSButton from "../shared/IMSButton";
import IMSStack from "../shared/IMSStack";
import IMSTypography from "../shared/IMSTypography";
import { formatMoney, formatQuantity } from "../utils/billing";
import { useNotificationsContext } from "../utils/NotificationsContext";
import useSettings from "../utils/useSettings";

const ICON = {
  pending: ReceiptLongOutlinedIcon,
  lowStock: WarningAmberIcon,
  outOfStock: ErrorOutlineIcon,
};

const TINT = {
  error: "error.main",
  warning: "orange.main",
  info: "primary.main",
};

/** Relative age, e.g. "today" / "3 days ago", without pulling in a plugin. */
const ageLabel = (at, t) => {
  const days = dayjs().startOf("day").diff(dayjs(at).startOf("day"), "day");
  if (days <= 0) return t("notifications.today");
  if (days === 1) return t("notifications.yesterday");
  return t("notifications.daysAgo", { days });
};

const NotificationBell = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { notifications, unread, markAllRead, dismiss, dismissAll } =
    useNotificationsContext();
  const [anchor, setAnchor] = useState(null);

  const open = Boolean(anchor);

  const handleOpen = (event) => {
    setAnchor(event.currentTarget);
    // Opening the panel is the moment they have been "seen".
    if (unread > 0) markAllRead();
  };
  const handleClose = () => setAnchor(null);

  const handleGo = (notification) => {
    handleClose();
    navigate(notification.link, { state: { search: notification.search } });
  };

  /** Numbers are formatted here so the strings stay translatable. */
  const bodyFor = (notification) => {
    const params = { ...notification.bodyParams };
    if (params.amount !== undefined) {
      params.amount = `${settings.currencySymbol}${formatMoney(params.amount)}`;
    }
    if (params.stock !== undefined) params.stock = formatQuantity(params.stock);
    if (params.limit !== undefined) params.limit = formatQuantity(params.limit);
    return t(notification.bodyKey, params);
  };

  const panel = (
    <IMSStack
      sx={{
        width: { xs: "100vw", sm: 400 },
        maxWidth: "100vw",
        height: { xs: "100%", md: "auto" },
        maxHeight: { md: 520 },
      }}
    >
      <IMSStack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2, py: 1.5, flexShrink: 0 }}
      >
        <IMSTypography fontWeight={600}>
          {t("notifications.title")}
        </IMSTypography>
        {notifications.length > 0 && (
          <IMSTypography variant="body2" color="natural.main">
            ({notifications.length})
          </IMSTypography>
        )}
        <IMSStack direction="row" spacing={0.5} sx={{ ml: "auto" }}>
          {notifications.length > 0 && (
            <Tooltip title={t("notifications.clearAll")}>
              <IconButton size="small" onClick={dismissAll}>
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            size="small"
            onClick={handleClose}
            aria-label={t("buttonText.cancel")}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </IMSStack>
      </IMSStack>
      <Divider />

      {notifications.length === 0 ? (
        <IMSStack
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ py: 6, px: 3, flex: 1 }}
        >
          <NotificationsNoneIcon sx={{ fontSize: 44, color: "natural.main" }} />
          <IMSTypography color="natural.main" textAlign="center">
            {t("notifications.empty")}
          </IMSTypography>
        </IMSStack>
      ) : (
        <List sx={{ overflowY: "auto", flex: 1, py: 0 }}>
          {notifications.map((notification) => {
            const Icon = ICON[notification.type] || NotificationsNoneIcon;
            return (
              <ListItemButton
                key={notification.id}
                data-testid={`notification-${notification.id}`}
                onClick={() => handleGo(notification)}
                alignItems="flex-start"
                sx={{
                  borderLeft: 3,
                  borderLeftColor: notification.unread
                    ? TINT[notification.severity]
                    : "transparent",
                  bgcolor: notification.unread
                    ? "rgba(0,120,129,0.04)"
                    : "transparent",
                  py: 1.25,
                }}
              >
                <Icon
                  sx={{
                    color: TINT[notification.severity],
                    mr: 1.5,
                    mt: 0.25,
                    flexShrink: 0,
                  }}
                />
                <ListItemText
                  primary={t(notification.titleKey, notification.titleParams)}
                  secondary={bodyFor(notification)}
                  primaryTypographyProps={{ fontWeight: 600, variant: "body2" }}
                  secondaryTypographyProps={{ variant: "body2" }}
                />
                <IMSStack alignItems="flex-end" sx={{ ml: 1, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    aria-label={t("notifications.dismiss")}
                    onClick={(event) => {
                      event.stopPropagation();
                      dismiss(notification);
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IMSTypography
                    variant="caption"
                    color="natural.main"
                    noWrap
                  >
                    {ageLabel(notification.at, t)}
                  </IMSTypography>
                </IMSStack>
              </ListItemButton>
            );
          })}
        </List>
      )}

      {notifications.length > 0 && (
        <>
          <Divider />
          <IMSStack sx={{ p: 1.5, flexShrink: 0 }}>
            <IMSButton
              fullWidth
              variant="outlined"
              onClick={() => {
                handleClose();
                navigate("/reports");
              }}
            >
              {t("notifications.viewReports")}
            </IMSButton>
          </IMSStack>
        </>
      )}
    </IMSStack>
  );

  return (
    <>
      <Tooltip title={t("notifications.title")}>
        <IconButton onClick={handleOpen} aria-label={t("notifications.title")}>
          <Badge
            badgeContent={unread}
            max={99}
            color="error"
            overlap="circular"
          >
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      {isMobile ? (
        // Full-height sheet reads like a native notification screen.
        <Drawer
          anchor="right"
          open={open}
          onClose={handleClose}
          PaperProps={{ sx: { width: "100vw" } }}
        >
          {panel}
        </Drawer>
      ) : (
        <Popover
          open={open}
          anchorEl={anchor}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { mt: 1, borderRadius: 2 } } }}
        >
          {panel}
        </Popover>
      )}
    </>
  );
};

export default NotificationBell;
