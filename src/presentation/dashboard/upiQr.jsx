import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { ButtonBase } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import IMSBox from "../../shared/IMSBox";
import IMSButton from "../../shared/IMSButton";
import IMSDialog from "../../shared/IMSDialog";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import { surface } from "../../shared/theme";
import { formatMoney } from "../../utils/billing";
import { isUpiId, upiPaymentLink } from "../../utils/upi";
import useSettings from "../../utils/useSettings";

const frame = {
  border: 1,
  borderColor: "primary.main",
  borderRadius: 2.5,
  bgcolor: "white.main",
  mb: 1.5,
};

/**
 * Takes Amount Paid's place when a bill is paid Online: a UPI QR for the
 * bill's total. Any UPI app that scans it opens a payment to the shop's UPI
 * ID with the amount filled in. Tapping the QR shows it full size, to turn the
 * screen to the customer.
 */
const UpiQr = ({ amount, invoiceNo }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [enlarged, setEnlarged] = useState(false);

  const total = `${settings.currencySymbol}${formatMoney(amount)}`;
  const upiId = String(settings.upiId ?? "").trim();
  const link = upiPaymentLink({
    upiId,
    name: settings.upiName || settings.shopName,
    amount,
    note: invoiceNo ? `Bill ${invoiceNo}` : "",
  });

  if (!isUpiId(upiId)) {
    return (
      <IMSStack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ ...frame, p: 1.5 }}
      >
        <QrCode2Icon sx={{ fontSize: 40, color: "natural.main" }} />
        <IMSStack spacing={0.75} sx={{ minWidth: 0 }}>
          <IMSTypography variant="body2" color="text.secondary">
            {t("upi.noUpiId")}
          </IMSTypography>
          <IMSButton
            size="small"
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
            onClick={() => navigate("/settings", { state: { tab: "billing" } })}
          >
            {t("upi.addUpiId")}
          </IMSButton>
        </IMSStack>
      </IMSStack>
    );
  }

  if (!link) {
    return (
      <IMSStack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ ...frame, p: 1.5 }}
      >
        <QrCode2Icon sx={{ fontSize: 40, color: "natural.main" }} />
        <IMSTypography variant="body2" color="text.secondary">
          {t("upi.noAmount")}
        </IMSTypography>
      </IMSStack>
    );
  }

  const qrLabel = t("upi.qrLabel", { amount: total });

  return (
    <>
      <IMSStack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ ...frame, p: 1.25 }}
        data-testid="upi-qr"
      >
        <ButtonBase
          onClick={() => setEnlarged(true)}
          aria-label={qrLabel}
          sx={{
            flexShrink: 0,
            p: 0.75,
            borderRadius: 1.5,
            border: `1px solid ${surface.border}`,
            bgcolor: "#fff",
          }}
        >
          <QRCodeSVG value={link} size={112} level="M" title={qrLabel} />
        </ButtonBase>
        <IMSStack sx={{ minWidth: 0 }}>
          <IMSTypography
            variant="caption"
            fontWeight={700}
            color="primary.dark"
            sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
          >
            {t("upi.scanToPay")}
          </IMSTypography>
          <IMSTypography
            color="primary.dark"
            sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25 }}
          >
            {total}
          </IMSTypography>
          <IMSTypography variant="caption" color="text.secondary">
            {t("upi.anyApp")}
          </IMSTypography>
          <IMSTypography
            variant="caption"
            color="text.secondary"
            noWrap
            title={upiId}
          >
            {t("upi.payTo", { upiId })}
          </IMSTypography>
          <IMSButton
            size="small"
            startIcon={<OpenInFullIcon sx={{ fontSize: "16px !important" }} />}
            onClick={() => setEnlarged(true)}
            sx={{ alignSelf: "flex-start", px: 0.5, mt: 0.25, minWidth: 0 }}
          >
            {t("upi.enlarge")}
          </IMSButton>
        </IMSStack>
      </IMSStack>

      <IMSDialog
        title={t("upi.scanToPay")}
        open={enlarged}
        handleClose={() => setEnlarged(false)}
        maxWidth="xs"
      >
        <IMSStack alignItems="center" spacing={1.5} sx={{ py: 1 }}>
          <IMSTypography
            color="primary.dark"
            sx={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}
          >
            {total}
          </IMSTypography>
          <IMSBox
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${surface.border}`,
              bgcolor: "#fff",
              width: "100%",
              maxWidth: 320,
              "& svg": { width: "100%", height: "auto", display: "block" },
            }}
          >
            <QRCodeSVG value={link} size={296} level="M" title={qrLabel} />
          </IMSBox>
          {settings.shopName && (
            <IMSTypography fontWeight={700}>{settings.shopName}</IMSTypography>
          )}
          <IMSTypography variant="body2" color="text.secondary">
            {t("upi.payTo", { upiId })}
          </IMSTypography>
          <IMSTypography variant="body2" color="text.secondary" align="center">
            {t("upi.anyApp")}
          </IMSTypography>
          <IMSButton
            variant="contained"
            fullWidth
            onClick={() => setEnlarged(false)}
          >
            {t("upi.close")}
          </IMSButton>
        </IMSStack>
      </IMSDialog>
    </>
  );
};

export default UpiQr;
