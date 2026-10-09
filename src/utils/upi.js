import { money, num } from "./billing";

/**
 * UPI payment QR codes.
 *
 * A QR holding a `upi://pay` link (NPCI's format) is what a shop's printed
 * UPI stand carries. Scanned with any UPI app — Google Pay, PhonePe, Paytm,
 * BHIM, a bank's app — it opens a payment to the shop's UPI ID with the amount
 * already filled in, so the customer only confirms with their UPI PIN. No
 * payment gateway, account or server of ours is involved: the money goes
 * straight from the customer's bank to the shop's.
 */

/** name@handle, e.g. 9876543210@ybl, devangi.tobacco@okhdfcbank. */
const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;

export const isUpiId = (value) => UPI_ID_REGEX.test(String(value ?? "").trim());

/** Some UPI apps reject a payee name or note that is not plain English text. */
const plainText = (value) =>
  /^[\x20-\x7E]*$/.test(String(value ?? "")) ? String(value ?? "").trim() : "";

/**
 * The payment link for `amount` rupees to `upiId`, or "" when there is no
 * valid UPI ID or nothing to pay.
 *
 * `name` is shown to the payer as who they are paying (left out unless it is
 * plain English text; the app then shows the name the bank has on record).
 * `note` appears in both parties' payment history, e.g. "Bill DT_7".
 */
export const upiPaymentLink = ({ upiId, name, amount, note }) => {
  const payTo = String(upiId ?? "").trim();
  const rupees = money(num(amount));
  if (!isUpiId(payTo) || !(rupees > 0)) return "";

  const params = [
    ["pa", payTo],
    ["pn", plainText(name)],
    ["am", rupees.toFixed(2)],
    ["cu", "INR"],
    ["tn", plainText(note)],
  ].filter(([, value]) => value);

  // Encoded, but with the @ of the UPI ID left as it is: some apps do not
  // decode it.
  const query = params
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%40/g, "@")}`)
    .join("&");
  return `upi://pay?${query}`;
};
