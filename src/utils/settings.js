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
    type: "text",
    label: "formLabel.shopName",
    md: 12,
    pattern: "notEmpty",
  },
  { name: "shopPhone", type: "text", label: "formLabel.phoneNumber", md: 6 },
  { name: "shopGSTIN", type: "text", label: "formLabel.GSTNumber", md: 6, pattern: "gstinOptional" },
  {
    name: "shopAddress",
    type: "text",
    label: "formLabel.shopAddress",
    md: 12,
    rows: 2,
    multiline: true,
  },
  {
    name: "invoicePrefix",
    type: "text",
    label: "formLabel.invoicePrefix",
    md: 4,
    pattern: "notEmpty",
  },
  {
    name: "gstRate",
    type: "number",
    label: "formLabel.gstRate",
    md: 4,
    pattern: "percent",
  },
  {
    name: "lowStockThreshold",
    type: "number",
    label: "formLabel.lowStockThreshold",
    md: 4,
    pattern: "nonNegative",
  },
  {
    name: "receiptFooter",
    type: "text",
    label: "formLabel.receiptFooter",
    md: 12,
  },
  {
    name: "backupHour",
    type: "number",
    label: "formLabel.backupHour",
    md: 6,
    pattern: "hour",
  },
];
