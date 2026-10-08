import { ButtonBase, alpha } from "@mui/material";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import IMSStack from "../shared/IMSStack";
import IMSTypography from "../shared/IMSTypography";
import { formatMoney } from "../utils/billing";
import { useNotificationsContext } from "../utils/NotificationsContext";
import { totalOutstanding } from "../utils/payments";
import { ordersOnDay, sumTotals } from "../utils/reporting";
import useSettings from "../utils/useSettings";

/**
 * Today's takings and what is still to collect, in view from every screen.
 * Reads the orders the notification poller already holds, so it costs no
 * extra request and refreshes whenever a bill is saved.
 */
const TodayCard = ({ onNavigate }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { orders } = useNotificationsContext();

  const { sale, bills, toCollect } = useMemo(() => {
    const today = ordersOnDay(orders, dayjs());
    return {
      sale: sumTotals(today),
      bills: today.length,
      toCollect: totalOutstanding(orders),
    };
  }, [orders]);

  const money = (value) => `${settings.currencySymbol}${formatMoney(value)}`;

  return (
    <ButtonBase
      data-testid="today-card"
      onClick={() => {
        onNavigate?.();
        navigate("/reports");
      }}
      sx={(theme) => ({
        display: "block",
        width: "100%",
        textAlign: "left",
        borderRadius: 2.5,
        px: 1.5,
        py: 1.25,
        mb: 1.5,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, #F5FAFA 100%)`,
      })}
    >
      <IMSStack direction="row" justifyContent="space-between" alignItems="center">
        <IMSTypography
          variant="caption"
          fontWeight={700}
          color="primary.dark"
          sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          {t("description.todaySale")}
        </IMSTypography>
        <IMSTypography variant="caption" color="primary.dark">
          {t("description.billCount", { count: bills })}
        </IMSTypography>
      </IMSStack>
      <IMSTypography
        color="primary.dark"
        sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}
      >
        {money(sale)}
      </IMSTypography>
      {toCollect > 0 && (
        <IMSTypography variant="caption" color="error.main" fontWeight={600}>
          {t("today.toCollect", { amount: money(toCollect) })}
        </IMSTypography>
      )}
    </ButtonBase>
  );
};

export default TodayCard;
