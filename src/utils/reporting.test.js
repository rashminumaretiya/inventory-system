import {
  grossProfit,
  inventoryValue,
  lowStockProducts,
  ordersInMonth,
  ordersOnDay,
  paymentBreakdown,
  salesByDate,
  sumTotals,
  topProducts,
} from "./reporting";

const orders = [
  {
    id: "1",
    billingDate: "2025-08-26T09:42:08.000Z",
    total: "42.00",
    payment: "Cash",
    balanceDue: 0,
    order: [
      { id: "p1", itemName: "Potato", quantityCategory: "Kg", itemQuantity: "2", subtotal: "22.00" },
      { id: "p2", itemName: "Waffer", quantityCategory: "Pcs.", itemQuantity: "2", subtotal: "20.00" },
    ],
  },
  {
    id: "2",
    billingDate: "2025-08-27T09:42:43.000Z",
    total: "590.47",
    payment: "Online",
    balanceDue: 0,
    order: [
      { id: "p3", itemName: "Orange", quantityCategory: "Kg", itemQuantity: "10", subtotal: "500.00" },
    ],
  },
  {
    id: "3",
    billingDate: "2025-09-01T09:44:57.000Z",
    total: "1450.00",
    payment: "Pending",
    balanceDue: 1450,
    order: [
      { id: "p3", itemName: "Orange", quantityCategory: "Kg", itemQuantity: "1", subtotal: "50.00" },
      { id: "p4", itemName: "Blue Berry", quantityCategory: "Pcs.", itemQuantity: "10", subtotal: "1200.00" },
    ],
  },
];

const products = [
  { id: "p1", itemName: "Potato", price: "11", costPrice: "8", quantityCategory: "Kg", stock: "9.000" },
  { id: "p2", itemName: "Waffer", price: "10", costPrice: "", quantityCategory: "Pcs.", stock: "120.000" },
  { id: "p3", itemName: "Orange", price: "50", costPrice: "35", quantityCategory: "Kg", stock: "386.000" },
  { id: "p4", itemName: "Blue Berry", price: "120", costPrice: "", quantityCategory: "Pcs.", stock: "0.000", lowStockAt: "5" },
  { id: "p5", itemName: "Chilli", price: "20", costPrice: "12", quantityCategory: "Kg", stock: "1.860" },
];

describe("period filters", () => {
  it("keeps only the selected month", () => {
    expect(ordersInMonth(orders, "2025-08-15").map((o) => o.id)).toEqual(["1", "2"]);
    expect(ordersInMonth(orders, "2025-09-15").map((o) => o.id)).toEqual(["3"]);
  });

  it("filters a single day", () => {
    expect(ordersOnDay(orders, "2025-08-27").map((o) => o.id)).toEqual(["2"]);
  });

  it("sums totals as money", () => {
    expect(sumTotals(orders)).toBe(2082.47);
  });
});

describe("salesByDate", () => {
  it("groups by day in ascending order", () => {
    expect(salesByDate(orders)).toEqual([
      { date: "2025-08-26", total: 42 },
      { date: "2025-08-27", total: 590.47 },
      { date: "2025-09-01", total: 1450 },
    ]);
  });
});

describe("topProducts", () => {
  it("ranks by revenue and merges repeat lines", () => {
    const top = topProducts(orders, 3);
    expect(top[0]).toMatchObject({ itemName: "Blue Berry", revenue: 1200 });
    expect(top[1]).toMatchObject({ itemName: "Orange", revenue: 550, quantity: 11 });
    expect(top).toHaveLength(3);
  });
});

describe("paymentBreakdown", () => {
  it("splits revenue by mode and totals what is unpaid", () => {
    const split = paymentBreakdown(orders);
    expect(split.Cash).toBe(42);
    expect(split.Online).toBe(590.47);
    expect(split.Pending).toBe(1450);
    expect(split.outstanding).toBe(1450);
  });
});

describe("grossProfit", () => {
  it("only counts lines whose product has a cost price", () => {
    const result = grossProfit(orders, products);
    // Potato 2Kg: 22 revenue, 16 cost. Orange 11Kg: 550 revenue, 385 cost.
    expect(result.cost).toBe(401);
    expect(result.profit).toBe(171);
  });

  it("reports how much revenue could be measured", () => {
    const result = grossProfit(orders, products);
    expect(result.revenue).toBe(1792);
    expect(result.coverage).toBeCloseTo(31.92, 1);
  });

  it("is zero-safe with no data", () => {
    expect(grossProfit([], []).coverage).toBe(0);
  });
});

describe("lowStockProducts", () => {
  it("uses the per-product limit when set, otherwise the shop default", () => {
    const low = lowStockProducts(products, 10);
    expect(low.map((p) => p.itemName)).toEqual(["Blue Berry", "Chilli", "Potato"]);
  });

  it("ignores everything when no threshold applies", () => {
    const noLimits = products.map(({ lowStockAt, ...rest }) => rest);
    expect(lowStockProducts(noLimits, 0)).toEqual([]);
  });
});

describe("inventoryValue", () => {
  it("values stock at retail and at cost", () => {
    const value = inventoryValue(products);
    // 9*11 + 120*10 + 386*50 + 0*120 + 1.86*20
    expect(value.retail).toBe(20636.2);
    // 9*8 + 386*35 + 1.86*12
    expect(value.cost).toBe(13604.32);
  });
});
