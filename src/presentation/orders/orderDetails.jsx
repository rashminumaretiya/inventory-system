import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Chip, Divider, Drawer, IconButton, Link, alpha } from "@mui/material";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import NavIcon from "../../Layout/NavIcon";
import { navItemByKey } from "../../Layout/navigation";
import IMSBox from "../../shared/IMSBox";
import IMSButton from "../../shared/IMSButton";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import { surface } from "../../shared/theme";
import {
  baseUnitOf,
  formatMoney,
  formatQuantity,
  lineSubtotal,
  num,
} from "../../utils/billing";
import { orderOutstanding } from "../../utils/payments";
import useSettings from "../../utils/useSettings";
import { WHATSAPP_GREEN } from "../../utils/whatsapp";

/** Chip colour for a bill's payment mode, shared with the orders table. */
export const paymentColor = (payment) =>
  payment === "Pending" ? "warning" : payment === "Online" ? "primary" : "success";

const SectionTitle = ({ children }) => (
  <IMSTypography
    variant="caption"
    sx={{
      display: "block",
      mb: 1,
      color: "natural.main",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </IMSTypography>
);

const SummaryRow = ({ label, value, tone, testId }) => (
  <IMSStack
    direction="row"
    justifyContent="space-between"
    alignItems="baseline"
    sx={{ py: 0.4 }}
  >
    <IMSTypography variant="body2" color="text.secondary">
      {label}
    </IMSTypography>
    <IMSTypography
      variant="body2"
      fontWeight={600}
      color={tone || "text.primary"}
      data-testid={testId}
    >
      {value}
    </IMSTypography>
  </IMSStack>
);

/**
 * Everything one bill holds, in a drawer from the right (the whole screen on
 * a phone): who it was for, each line, the totals, payments taken later, and
 * what can be done with it next.
 *
 * `order` can be missing while the drawer slides shut after a delete; the
 * panel is then simply empty.
 */
const OrderDetails = ({
  order,
  open,
  onClose,
  onCollect,
  onPrint,
  onDownload,
  onShare,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const money = (value) => `${settings.currencySymbol}${formatMoney(value)}`;

  const lines = order?.order || [];
  const lineTotal = (line) =>
    line.subtotal !== undefined ? line.subtotal : lineSubtotal(line);
  const subtotal =
    order?.subtotal !== undefined
      ? order.subtotal
      : lines.reduce((sum, line) => sum + num(lineTotal(line)), 0);
  const discount = num(order?.discountAmount);
  const gst = num(order?.GSTAmount);
  const owed = orderOutstanding(order);
  const paidRecorded = ![undefined, null, ""].includes(order?.amountPaid);
  const customer = order?.customerInfo || {};

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        role: "dialog",
        "aria-labelledby": "order-details-title",
        sx: {
          width: { xs: "100vw", sm: 440 },
          maxWidth: "100vw",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {order && (
        <>
          {/* Which bill: number, how it was paid, and when. */}
          <IMSStack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              px: 2.5,
              pb: 2,
              pt: "calc(16px + env(safe-area-inset-top))",
              borderBottom: `1px solid ${surface.border}`,
              flexShrink: 0,
            }}
          >
            <NavIcon item={navItemByKey("orders")} size={40} />
            <IMSStack sx={{ flex: 1, minWidth: 0 }}>
              <IMSStack direction="row" alignItems="center" spacing={1}>
                <IMSTypography
                  id="order-details-title"
                  variant="h6"
                  fontWeight={700}
                  noWrap
                  sx={{ fontSize: "1.15rem" }}
                >
                  {order.invoiceNo}
                </IMSTypography>
                <Chip
                  size="small"
                  label={order.payment}
                  color={paymentColor(order.payment)}
                />
              </IMSStack>
              <IMSTypography variant="body2" color="text.secondary">
                {dayjs(order.billingDate).format("DD/MM/YYYY · hh:mm A")}
              </IMSTypography>
            </IMSStack>
            <IconButton onClick={onClose} aria-label={t("billView.close")}>
              <CloseIcon />
            </IconButton>
          </IMSStack>

          <IMSStack spacing={2.5} sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
            {/* Who it was for. */}
            <IMSBox>
              <SectionTitle>{t("billView.customer")}</SectionTitle>
              <IMSBox
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  border: `1px solid ${surface.border}`,
                }}
              >
                <IMSTypography fontWeight={600}>
                  {customer.vendorName || "—"}
                </IMSTypography>
                {customer.vendorPhone && (
                  <Link
                    href={`tel:${customer.vendorPhone}`}
                    underline="hover"
                    variant="body2"
                    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
                  >
                    <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                    {customer.vendorPhone}
                  </Link>
                )}
                {customer.address && (
                  <IMSTypography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mt: 0.5 }}
                  >
                    <LocationOnOutlinedIcon sx={{ fontSize: 16, mt: "2px" }} />
                    {customer.address}
                  </IMSTypography>
                )}
                {order.GSTNumber && (
                  <IMSTypography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t("formLabel.GSTNumber")}: {order.GSTNumber}
                  </IMSTypography>
                )}
              </IMSBox>
            </IMSBox>

            {/* What was bought. */}
            <IMSBox>
              <SectionTitle>{t("billView.items", { count: lines.length })}</SectionTitle>
              <IMSBox sx={{ borderRadius: 2.5, border: `1px solid ${surface.border}` }}>
                {lines.map((line, index) => (
                  <IMSStack
                    key={`${line.id}-${index}`}
                    data-testid="order-line"
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      borderTop: index ? `1px solid ${surface.border}` : 0,
                    }}
                  >
                    <IMSStack sx={{ flex: 1, minWidth: 0 }}>
                      <IMSTypography variant="body2" fontWeight={600}>
                        {line.itemName}
                      </IMSTypography>
                      {/* Price is per base unit, so 250 Grams reads "× ₹200.00/Kg". */}
                      <IMSTypography variant="caption" color="text.secondary">
                        {formatQuantity(line.itemQuantity)} {line.quantityCategory} ×{" "}
                        {money(line.price)}/{baseUnitOf(line.quantityCategory)}
                      </IMSTypography>
                    </IMSStack>
                    <IMSTypography variant="body2" fontWeight={600}>
                      {money(lineTotal(line))}
                    </IMSTypography>
                  </IMSStack>
                ))}
              </IMSBox>
            </IMSBox>

            {/* The money, laid out like the bill screen's summary. */}
            <IMSBox
              sx={{
                bgcolor: "primary.light",
                border: 1,
                borderColor: "primary.main",
                borderRadius: 2.5,
                px: 2,
                py: 1.5,
              }}
            >
              <SummaryRow label={t("formLabel.subtotal")} value={money(subtotal)} />
              {discount > 0 && (
                <SummaryRow
                  label={t("formLabel.discountApplied")}
                  value={`− ${money(discount)}`}
                />
              )}
              {gst > 0 && (
                <SummaryRow
                  label={`${t("formLabel.GSTAmount")}${
                    order.GSTRate ? ` (${num(order.GSTRate)}%)` : ""
                  }`}
                  value={money(gst)}
                />
              )}
              <Divider sx={{ my: 1, borderColor: "primary.main", opacity: 0.25 }} />
              <IMSStack direction="row" justifyContent="space-between" alignItems="center">
                <IMSTypography fontWeight={700} color="primary.dark">
                  {t("formLabel.totalPrice")}
                </IMSTypography>
                <IMSTypography
                  color="primary.dark"
                  data-testid="order-total"
                  sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}
                >
                  {money(order.total)}
                </IMSTypography>
              </IMSStack>
              <Divider sx={{ my: 1, borderColor: "primary.main", opacity: 0.25 }} />
              {paidRecorded && (
                <SummaryRow label={t("formLabel.amountPay")} value={money(order.amountPaid)} />
              )}
              {num(order.changeDue) > 0 && (
                <SummaryRow
                  label={t("formLabel.changeDue")}
                  value={money(order.changeDue)}
                  tone="success.main"
                />
              )}
              {owed > 0 ? (
                <SummaryRow
                  label={t("formLabel.balanceDue")}
                  value={money(owed)}
                  tone="error.main"
                  testId="order-balance"
                />
              ) : (
                <IMSStack
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                  sx={{ py: 0.4, color: "success.main" }}
                >
                  <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                  <IMSTypography variant="body2" fontWeight={600} color="inherit">
                    {t("billView.paidInFull")}
                  </IMSTypography>
                </IMSStack>
              )}
            </IMSBox>

            {/* Money that came in after the sale (khata collections). */}
            {Array.isArray(order.payments) && order.payments.length > 0 && (
              <IMSBox>
                <SectionTitle>{t("billView.payments")}</SectionTitle>
                <IMSBox sx={{ borderRadius: 2.5, border: `1px solid ${surface.border}` }}>
                  {order.payments.map((payment, index) => (
                    <IMSStack
                      key={`${payment.at}-${index}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderTop: index ? `1px solid ${surface.border}` : 0,
                      }}
                    >
                      <IMSTypography variant="body2" color="text.secondary">
                        {dayjs(payment.at).format("DD/MM/YYYY")} · {payment.mode}
                      </IMSTypography>
                      <IMSTypography variant="body2" fontWeight={600} color="success.main">
                        {money(payment.amount)}
                      </IMSTypography>
                    </IMSStack>
                  ))}
                </IMSBox>
              </IMSBox>
            )}
          </IMSStack>

          {/* What to do with it next. */}
          <IMSStack
            spacing={1}
            sx={{
              p: 2,
              pb: "calc(16px + env(safe-area-inset-bottom))",
              borderTop: `1px solid ${surface.border}`,
              flexShrink: 0,
              "& .MuiButton-root": { minWidth: 0, whiteSpace: "nowrap" },
            }}
          >
            {owed > 0 && (
              <IMSButton
                fullWidth
                variant="contained"
                color="success"
                startIcon={<CurrencyRupeeIcon />}
                onClick={onCollect}
              >
                {t("buttonText.collect")} · {money(owed)}
              </IMSButton>
            )}
            <IMSStack direction="row" spacing={1}>
              <IMSButton
                fullWidth
                variant="outlined"
                startIcon={<PrintOutlinedIcon />}
                onClick={onPrint}
              >
                {t("buttonText.print")}
              </IMSButton>
              <IMSButton
                fullWidth
                variant="outlined"
                startIcon={<DownloadOutlinedIcon />}
                onClick={onDownload}
              >
                {t("buttonText.download")}
              </IMSButton>
              <IMSButton
                fullWidth
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                onClick={onShare}
                sx={{
                  color: WHATSAPP_GREEN,
                  borderColor: alpha(WHATSAPP_GREEN, 0.5),
                  "&:hover": { borderColor: WHATSAPP_GREEN },
                }}
              >
                {t("whatsapp.send")}
              </IMSButton>
            </IMSStack>
            <IMSStack direction="row" spacing={1}>
              <IMSButton fullWidth startIcon={<EditOutlinedIcon />} onClick={onEdit}>
                {t("billView.edit")}
              </IMSButton>
              <IMSButton
                fullWidth
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={onDelete}
              >
                {t("buttonText.delete")}
              </IMSButton>
            </IMSStack>
          </IMSStack>
        </>
      )}
    </Drawer>
  );
};

export default OrderDetails;
