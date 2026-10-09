import { isUpiId } from "./upi";

const isBlank = (value) =>
  value === "" || value === null || value === undefined;

/**
 * GSTIN: 2 digit state code, 10 char PAN, entity digit, 'Z', checksum char.
 * e.g. 24ABCDE1234F1Z5
 */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/** Indian mobile numbers are 10 digits starting 6-9, optionally +91 prefixed. */
const PHONE_REGEX = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;

const validation = (pattern, value, label, t) => {
  const fieldName = () => t(label).toLowerCase();
  const required = () => t("errorMsg.pleaseEnter", { field: fieldName() });

  const notEmpty = () => {
    if (isBlank(value) || String(value).trim() === "") return required();
  };

  const phoneNumber = () => {
    if (isBlank(value)) return required();
    const digits = String(value).replace(/[\s().-]/g, "");
    if (!PHONE_REGEX.test(digits)) return t("errorMsg.validNumber");
  };

  const optionalPhone = () => {
    if (isBlank(value) || String(value).trim() === "") return;
    return phoneNumber();
  };

  const gstin = () => {
    if (isBlank(value) || String(value).trim() === "") return required();
    if (!GSTIN_REGEX.test(String(value).trim().toUpperCase()))
      return t("errorMsg.validGSTIN");
  };

  const gstinOptional = () => {
    if (isBlank(value) || String(value).trim() === "") return;
    return gstin();
  };

  /** Required and strictly greater than zero — prices, quantities. */
  const positiveNumber = () => {
    if (isBlank(value) || String(value).trim() === "") return required();
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return t("errorMsg.validNumber");
    if (parsed <= 0) return t("errorMsg.greaterThanZero", { field: t(label) });
  };

  /** Required, zero allowed — stock, thresholds. */
  const nonNegative = () => {
    if (isBlank(value) || String(value).trim() === "") return required();
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return t("errorMsg.validNumber");
    if (parsed < 0) return t("errorMsg.notNegative", { field: t(label) });
  };

  const percent = () => {
    const base = nonNegative();
    if (base) return base;
    if (Number(value) > 100) return t("errorMsg.maxPercent");
  };

  const hour = () => {
    const base = nonNegative();
    if (base) return base;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed > 23)
      return t("errorMsg.validHour");
  };

  /** HSN codes are 4, 6 or 8 digits; any length in between is accepted. */
  const hsnOptional = () => {
    if (isBlank(value) || String(value).trim() === "") return;
    if (!/^\d{4,8}$/.test(String(value).trim())) return t("errorMsg.validHSN");
  };

  /** A UPI ID such as 9876543210@ybl; empty means no payment QR. */
  const upiIdOptional = () => {
    if (isBlank(value) || String(value).trim() === "") return;
    if (!isUpiId(value)) return t("errorMsg.validUpiId");
  };

  switch (pattern) {
    case "notEmpty":
      return notEmpty();
    case "phoneNumber":
      return phoneNumber();
    case "optionalPhone":
      return optionalPhone();
    case "gstin":
      return gstin();
    case "gstinOptional":
      return gstinOptional();
    case "positiveNumber":
      return positiveNumber();
    case "nonNegative":
      return nonNegative();
    case "percent":
      return percent();
    case "hour":
      return hour();
    case "hsnOptional":
      return hsnOptional();
    case "upiIdOptional":
      return upiIdOptional();
    default:
      return "";
  }
};

export default validation;
