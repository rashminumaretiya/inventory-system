import dayjs from "dayjs";
import {
  applyState,
  buildNotifications,
  lowStockAlerts,
  notificationKey,
  orderOutstanding,
  pendingPaymentAlerts,
  readState,
  unreadCount,
  writeState,
} from "./notifications";

const now = dayjs("2026-09-30");

const orders = [
  {
    id: "o1",
    invoiceNo: "DT_1",
    billingDate: "2026-09-01T00:00:00.000Z",
    total: "500.00",
    payment: "Pending",
    balanceDue: 500,
    customerInfo: { vendorName: "Jay", vendorPhone: "9876543100" },
  },
  {
    id: "o2",
    invoiceNo: "DT_2",
    billingDate: "2026-09-20T00:00:00.000Z",
    total: "300.00",
    payment: "Cash",
    balanceDue: 120,
    customerInfo: { vendorName: "Jay", vendorPhone: "9876543100" },
  },
  {
    id: "o3",
    invoiceNo: "DT_3",
    billingDate: "2026-09-25T00:00:00.000Z",
    total: "1000.00",
    payment: "Cash",
    balanceDue: 0,
    customerInfo: { vendorName: "Abhi", vendorPhone: "9812121212" },
  },
  {
    // Saved before balanceDue existed: Pending means nothing was collected.
    id: "o4",
    invoiceNo: "DT_4",
    billingDate: "2026-08-10T00:00:00.000Z",
    total: "250.00",
    payment: "Pending",
    customerInfo: { vendorName: "Ramesh", vendorPhone: "7878787871" },
  },
];

const products = [
  { id: "p1", itemName: "Potato", stock: "9.000", quantityCategory: "Kg" },
  { id: "p2", itemName: "Waffer", stock: "0.000", quantityCategory: "Pcs." },
  { id: "p3", itemName: "Chilli", stock: "1.860", quantityCategory: "Grams", lowStockAt: "5" },
  { id: "p4", itemName: "Banana", stock: "1964.000", quantityCategory: "Pcs." },
];

const settings = { lowStockThreshold: 10 };

beforeEach(() => localStorage.clear());

describe("orderOutstanding", () => {
  it("uses balanceDue when present", () => {
    expect(orderOutstanding(orders[1])).toBe(120);
    expect(orderOutstanding(orders[2])).toBe(0);
  });

  it("treats a legacy Pending bill as fully unpaid", () => {
    expect(orderOutstanding(orders[3])).toBe(250);
  });

  it("is zero for a paid legacy bill", () => {
    expect(orderOutstanding({ payment: "Cash", total: "99.00" })).toBe(0);
  });
});

describe("pendingPaymentAlerts", () => {
  it("groups a customer's unpaid bills into one alert", () => {
    const alerts = pendingPaymentAlerts(orders, now);
    const jay = alerts.find((alert) => alert.name === "Jay");
    expect(jay.amount).toBe(620);
    expect(jay.invoices).toEqual(["DT_1", "DT_2"]);
  });

  it("counts days from the oldest unpaid bill", () => {
    const alerts = pendingPaymentAlerts(orders, now);
    expect(alerts.find((a) => a.name === "Jay").days).toBe(29);
    expect(alerts.find((a) => a.name === "Ramesh").days).toBe(51);
  });

  it("leaves out customers who owe nothing", () => {
    const names = pendingPaymentAlerts(orders, now).map((a) => a.name);
    expect(names).not.toContain("Abhi");
  });

  it("orders by amount owed, largest first", () => {
    expect(pendingPaymentAlerts(orders, now).map((a) => a.name)).toEqual([
      "Jay",
      "Ramesh",
    ]);
  });
});

describe("lowStockAlerts", () => {
  it("includes items at or below the shop threshold", () => {
    const names = lowStockAlerts(products, 10).map((a) => a.itemName);
    expect(names).toContain("Potato");
    expect(names).not.toContain("Banana");
  });

  it("prefers a product's own limit over the shop default", () => {
    const chilli = lowStockAlerts(products, 10).find((a) => a.itemName === "Chilli");
    expect(chilli.limit).toBe(5);
  });

  it("puts out-of-stock items first", () => {
    const alerts = lowStockAlerts(products, 10);
    expect(alerts[0].itemName).toBe("Waffer");
    expect(alerts[0].isOut).toBe(true);
  });

  it("reports a legacy Grams product in its real unit", () => {
    const chilli = lowStockAlerts(products, 10).find((a) => a.itemName === "Chilli");
    expect(chilli.unit).toBe("Kg");
    expect(chilli.stock).toBe(1.86);
  });

  it("needs no shop threshold to report a zero-stock item or a per-item limit", () => {
    const names = lowStockAlerts(products, 0).map((a) => a.itemName);
    // Waffer is at zero; Chilli has its own limit of 5.
    expect(names).toEqual(["Waffer", "Chilli"]);
    // Potato has neither, so with no shop threshold it is not flagged.
    expect(names).not.toContain("Potato");
  });
});

describe("buildNotifications", () => {
  it("returns both kinds, unpaid money first", () => {
    const list = buildNotifications({ orders, products, settings, now });
    expect(list[0].type).toBe("pending");
    expect(list.map((n) => n.type)).toContain("outOfStock");
    expect(list.map((n) => n.type)).toContain("lowStock");
  });

  it("carries translation keys and params rather than finished text", () => {
    const [first] = buildNotifications({ orders, products, settings, now });
    expect(first.titleKey).toBe("notifications.pendingTitle");
    expect(first.titleParams).toEqual({ name: "Jay" });
    expect(first.bodyParams).toMatchObject({ amount: 620, count: 2 });
  });

  it("links each alert to the screen that resolves it", () => {
    const list = buildNotifications({ orders, products, settings, now });
    expect(list.find((n) => n.type === "pending").link).toBe("/orders");
    expect(list.find((n) => n.type === "lowStock").link).toBe("/product");
  });

  it("honours the per-type switches", () => {
    const noPending = buildNotifications({
      orders,
      products,
      settings: { ...settings, notifyPendingPayments: false },
      now,
    });
    expect(noPending.every((n) => n.type !== "pending")).toBe(true);

    const noStock = buildNotifications({
      orders,
      products,
      settings: { ...settings, notifyLowStock: false },
      now,
    });
    expect(noStock.every((n) => n.type === "pending")).toBe(true);
  });

  it("is empty when nothing needs attention", () => {
    expect(
      buildNotifications({
        orders: [orders[2]],
        products: [products[3]],
        settings,
        now,
      })
    ).toEqual([]);
  });
});

describe("read and dismissed state", () => {
  const list = () => buildNotifications({ orders, products, settings, now });

  it("marks everything unread to begin with", () => {
    const applied = applyState(list(), readState());
    expect(unreadCount(applied)).toBe(applied.length);
  });

  it("stops counting an alert once it is seen", () => {
    const notifications = list();
    writeState({ seen: notifications.map(notificationKey), dismissed: [] });
    expect(unreadCount(applyState(notifications, readState()))).toBe(0);
  });

  it("hides a dismissed alert", () => {
    const notifications = list();
    const target = notifications[0];
    writeState({ seen: [], dismissed: [notificationKey(target)] });

    const applied = applyState(notifications, readState());
    expect(applied.find((n) => n.id === target.id)).toBeUndefined();
  });

  it("brings a dismissed stock alert back when stock drops further", () => {
    const notifications = list();
    const chilli = notifications.find((n) => n.id === "stock:p3");
    writeState({ seen: [], dismissed: [notificationKey(chilli)] });
    expect(applyState(notifications, readState()).find((n) => n.id === "stock:p3")).toBeUndefined();

    // Same product, less stock: a new signature, so the alert returns.
    const worse = buildNotifications({
      orders,
      products: products.map((p) =>
        p.id === "p3" ? { ...p, stock: "0.500" } : p
      ),
      settings,
      now,
    });
    expect(
      applyState(worse, readState()).find((n) => n.id === "stock:p3")
    ).toBeDefined();
  });

  it("survives unreadable storage", () => {
    localStorage.setItem("notificationState", "not json");
    expect(readState()).toEqual({ seen: [], dismissed: [] });
  });
});
