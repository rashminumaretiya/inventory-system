/**
 * Shop settings. Kept in localStorage so a single-till store needs no extra
 * backend collection, and read through getSettings() so every caller sees the
 * same defaults.
 */

const STORAGE_KEY = "shopSettings";

export const defaultSettings = {
  shopName: "દેવાંગી ટોબેકો",
  shopAddress: "",
  shopPhone: "",
  shopGSTIN: "",
  invoicePrefix: "DT",
  gstRate: 18,
  lowStockThreshold: 10,
  currencySymbol: "₹",
  receiptFooter: "આભાર! ફરી મુલાકાત લો!",
  autoBackup: true,
  backupHour: 10,
  notifyPendingPayments: true,
  notifyLowStock: true,
  /** Minutes of inactivity before the till locks itself; 0 means never. */
  autoLockMinutes: 10,
};

export const getSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultSettings, ...(stored || {}) };
  } catch {
    return { ...defaultSettings };
  }
};

export const saveSettings = (settings) => {
  const merged = { ...getSettings(), ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // A full or blocked storage should not take the till down.
  }
  window.dispatchEvent(new Event("shopSettingsChanged"));
  return merged;
};

export const settingsFields = [
  {
    name: "shopName",
    // Free text: types Gujarati while the app is in Gujarati.
    transliterate: true,
    type: "text",
    label: "formLabel.shopName",
    xs: 12,
    md: 12,
    pattern: "notEmpty",
  },
  {
    name: "shopPhone",
    type: "text",
    label: "formLabel.phoneNumber",
    xs: 12,
    md: 6,
    pattern: "optionalPhone",
  },
  {
    name: "shopGSTIN",
    type: "text",
    label: "formLabel.GSTNumber",
    xs: 12,
    md: 6,
    pattern: "gstinOptional",
  },
  {
    name: "shopAddress",
    // Free text: types Gujarati while the app is in Gujarati.
    transliterate: true,
    type: "text",
    label: "formLabel.shopAddress",
    xs: 12,
    md: 12,
    rows: 2,
    multiline: true,
  },
  {
    name: "invoicePrefix",
    type: "text",
    label: "formLabel.invoicePrefix",
    xs: 12,
    md: 4,
    pattern: "notEmpty",
  },
  {
    name: "gstRate",
    type: "number",
    label: "formLabel.gstRate",
    xs: 6,
    md: 4,
    pattern: "percent",
  },
  {
    name: "lowStockThreshold",
    type: "number",
    label: "formLabel.lowStockThreshold",
    xs: 6,
    md: 4,
    pattern: "nonNegative",
  },
  {
    name: "receiptFooter",
    // Free text: types Gujarati while the app is in Gujarati.
    transliterate: true,
    type: "text",
    label: "formLabel.receiptFooter",
    xs: 12,
    md: 12,
  },
  {
    name: "autoLockMinutes",
    type: "number",
    label: "formLabel.autoLockMinutes",
    xs: 6,
    md: 4,
    pattern: "nonNegative",
    inputProps: { min: 0, step: 1 },
  },
  {
    name: "backupHour",
    type: "number",
    label: "formLabel.backupHour",
    xs: 6,
    md: 6,
    pattern: "hour",
  },
];
