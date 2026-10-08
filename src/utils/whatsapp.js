import dayjs from "dayjs";

import { formatMoney, formatQuantity, lineSubtotal, num } from "./billing";
import { orderOutstanding } from "./payments";

/**
 * WhatsApp without an API or an account: a wa.me link opens WhatsApp (the app
 * on a phone, WhatsApp Web on a computer) with the message already typed, and
 * the shopkeeper presses Send. Nothing passes through a server of ours.
 */

/**
 * WhatsApp's green, darkened enough to read as an icon on white (the brand
 * #25D366 is too pale for that).
 */
export const WHATSAPP_GREEN = "#16A34A";

/**
 * The number as WhatsApp wants it: country code first, digits only. Ten
 * digits are taken to be an Indian mobile. Returns "" when it is not a
 * usable number, and WhatsApp then asks who to send the message to.
 */
export const toWhatsAppNumber = (phone) => {
  let digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2); // 0091… dialled abroad
  else if (digits.startsWith("0")) digits = digits.slice(1); // 098… trunk prefix
  if (digits.length === 10) return `91${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : "";
};

export const whatsAppUrl = (phone, text) =>
  `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(text)}`;

/** Open WhatsApp with `text` ready to send to `phone`. */
export const openWhatsApp = (phone, text) => {
  const url = whatsAppUrl(phone, text);
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
};

const moneyIn = (settings) => (value) =>
  `${settings?.currencySymbol ?? "₹"}${formatMoney(value)}`;

/**
 * A saved bill as a WhatsApp message, in the language the app is in.
 * WhatsApp shows *text* in bold. Subtotal, discount and GST lines appear only
 * when they change the total; paid and balance only when money is owed.
 */
export const billMessage = (order, { t, settings = {} }) => {
  const amount = moneyIn(settings);
  const out = [];

  if (settings.shopName) out.push(`*${settings.shopName}*`);
  out.push(
    t("whatsapp.billHeading", {
      invoice: order?.invoiceNo,
      date: dayjs(order?.billingDate).format("DD/MM/YYYY"),
    }),
  );
  const name = order?.customerInfo?.vendorName?.trim();
  if (name) out.push(t("whatsapp.customer", { name }));
  out.push("");

  (order?.order || []).forEach((line, index) => {
    out.push(
      `${index + 1}. ${line.itemName} · ${formatQuantity(line.itemQuantity)} ${
        line.quantityCategory
      } · ${amount(lineSubtotal(line))}`,
    );
  });
  out.push("");

  const discount = num(order?.discountAmount);
  const gst = num(order?.GSTAmount);
  if (discount > 0 || gst > 0) {
    out.push(`${t("formLabel.subtotal")}: ${amount(order?.subtotal)}`);
  }
  if (discount > 0) {
    out.push(`${t("formLabel.discountApplied")}: −${amount(discount)}`);
  }
  if (gst > 0) {
    out.push(
      `${t("formLabel.GSTAmount")} (${num(order?.GSTRate)}%): ${amount(gst)}`,
    );
  }
  out.push(`*${t("formLabel.totalPrice")}: ${amount(order?.total)}*`);

  const owed = orderOutstanding(order);
  if (owed > 0) {
    out.push(`${t("formLabel.amountPay")}: ${amount(order?.amountPaid)}`);
    out.push(`*${t("formLabel.balanceDue")}: ${amount(owed)}*`);
  }

  if (settings.receiptFooter) out.push("", settings.receiptFooter);
  return out.join("\n");
};

/** A polite reminder of what a customer owes across their bills. */
export const reminderMessage = ({ name, amount, count }, { t, settings = {} }) =>
  t("whatsapp.reminder", {
    name: name && name !== "—" ? name : t("whatsapp.customerFallback"),
    shop: settings.shopName || t("whatsapp.shopFallback"),
    amount: moneyIn(settings)(amount),
    count,
  });
