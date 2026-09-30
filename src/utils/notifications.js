import dayjs from "dayjs";
import { baseUnitOf, money, num, productStockInBase } from "./billing";
import { orderOutstanding } from "./payments";

const STORAGE_KEY = "notificationState";

export { orderOutstanding };

/**
 * One alert per customer rather than one per bill, so a regular who owes on
 * four bills does not bury everything else.
 */
export const pendingPaymentAlerts = (orders = [], now = dayjs()) => {
  const byCustomer = new Map();

  orders.forEach((order) => {
    const outstanding = orderOutstanding(order);
    if (outstanding <= 0) return;

    const name = order?.customerInfo?.vendorName?.trim() || "—";
    const phone = order?.customerInfo?.vendorPhone?.trim() || "";
    const key = phone || name;

    const entry =
      byCustomer.get(key) ||
      {
        key,
        name,
        phone,
        amount: 0,
        invoices: [],
        oldestDate: order?.billingDate,
      };

    entry.amount = money(entry.amount + outstanding);
    entry.invoices.push(order.invoiceNo);
    if (dayjs(order?.billingDate).isBefore(dayjs(entry.oldestDate))) {
      entry.oldestDate = order.billingDate;
    }
    byCustomer.set(key, entry);
  });

  return Array.from(byCustomer.values())
    .map((entry) => ({
      ...entry,
      days: Math.max(now.startOf("day").diff(dayjs(entry.oldestDate).startOf("day"), "day"), 0),
    }))
    .sort((a, b) => b.amount - a.amount);
};

/** Products at or under their limit, out-of-stock first, then lowest stock. */
export const lowStockAlerts = (products = [], threshold = 0) =>
  products
    .map((product) => {
      const stock = productStockInBase(product);
      const limit = product?.lowStockAt
        ? num(product.lowStockAt)
        : num(threshold);
      return {
        id: product.id,
        itemName: product.itemName,
        stock,
        limit,
        unit: baseUnitOf(product.quantityCategory),
        isOut: stock <= 0,
      };
    })
    .filter((product) => product.isOut || (product.limit > 0 && product.stock <= product.limit))
    .sort((a, b) => Number(b.isOut) - Number(a.isOut) || a.stock - b.stock);

/**
 * Build the notification list.
 *
 * Every entry carries translation keys rather than finished strings, so the
 * panel renders correctly in English and Gujarati. `signature` encodes the
 * numbers behind the alert: when it changes the alert counts as new again, so
 * dismissing "low stock" does not hide a later, worse drop.
 */
export const buildNotifications = ({
  orders = [],
  products = [],
  settings = {},
  now = dayjs(),
} = {}) => {
  const list = [];

  if (settings.notifyPendingPayments !== false) {
    pendingPaymentAlerts(orders, now).forEach((alert) => {
      list.push({
        id: `pending:${alert.key}`,
        signature: `${alert.amount}:${alert.invoices.length}`,
        type: "pending",
        severity: "error",
        titleKey: "notifications.pendingTitle",
        titleParams: { name: alert.name },
        bodyKey: "notifications.pendingBody",
        bodyParams: {
          amount: alert.amount,
          count: alert.invoices.length,
          days: alert.days,
        },
        amount: alert.amount,
        link: "/orders",
        search: alert.name,
        at: alert.oldestDate,
        sortWeight: 1000 + alert.amount,
      });
    });
  }

  if (settings.notifyLowStock !== false) {
    lowStockAlerts(products, settings.lowStockThreshold).forEach((alert) => {
      list.push({
        id: `stock:${alert.id}`,
        signature: String(alert.stock),
        type: alert.isOut ? "outOfStock" : "lowStock",
        severity: alert.isOut ? "error" : "warning",
        titleKey: alert.isOut
          ? "notifications.outOfStockTitle"
          : "notifications.lowStockTitle",
        titleParams: { name: alert.itemName },
        bodyKey: alert.isOut
          ? "notifications.outOfStockBody"
          : "notifications.lowStockBody",
        bodyParams: {
          stock: alert.stock,
          unit: alert.unit,
          limit: alert.limit,
        },
        link: "/product",
        search: alert.itemName,
        at: now.toISOString(),
        sortWeight: alert.isOut ? 900 : 500 - alert.stock,
      });
    });
  }

  return list.sort((a, b) => b.sortWeight - a.sortWeight);
};

/** Identity including the numbers, so a changed alert is a new alert. */
export const notificationKey = (notification) =>
  `${notification.id}:${notification.signature}`;

const emptyState = { seen: [], dismissed: [] };

export const readState = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      seen: Array.isArray(stored?.seen) ? stored.seen : [],
      dismissed: Array.isArray(stored?.dismissed) ? stored.dismissed : [],
    };
  } catch {
    return { ...emptyState };
  }
};

export const writeState = (state) => {
  try {
    // Keep the lists bounded; stale keys can never match a live alert anyway.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        seen: state.seen.slice(-300),
        dismissed: state.dismissed.slice(-300),
      })
    );
  } catch {
    /* Storage being unavailable must not break the bell. */
  }
};

/** Drop dismissed alerts and flag which of the rest are unread. */
export const applyState = (notifications = [], state = emptyState) => {
  const seen = new Set(state.seen);
  const dismissed = new Set(state.dismissed);

  return notifications
    .filter((notification) => !dismissed.has(notificationKey(notification)))
    .map((notification) => ({
      ...notification,
      unread: !seen.has(notificationKey(notification)),
    }));
};

export const unreadCount = (notifications = []) =>
  notifications.filter((notification) => notification.unread).length;
