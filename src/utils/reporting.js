import dayjs from "dayjs";
import {
  baseUnitOf,
  lineBaseQuantity,
  money,
  num,
  productStockInBase,
} from "./billing";

/** Orders billed in the same calendar month as `month`. */
export const ordersInMonth = (orders = [], month) => {
  if (!month) return orders;
  const target = dayjs(month);
  return orders.filter((order) => {
    const date = dayjs(order.billingDate);
    return date.month() === target.month() && date.year() === target.year();
  });
};

export const ordersOnDay = (orders = [], day = dayjs()) =>
  orders.filter((order) => dayjs(order.billingDate).isSame(dayjs(day), "day"));

export const sumTotals = (orders = []) =>
  money(orders.reduce((sum, order) => sum + num(order.total), 0));

/** [{ date, total }] ascending, ready for a time-series chart. */
export const salesByDate = (orders = []) => {
  const grouped = orders.reduce((acc, order) => {
    const date = dayjs(order.billingDate).format("YYYY-MM-DD");
    acc[date] = (acc[date] || 0) + num(order.total);
    return acc;
  }, {});

  return Object.keys(grouped)
    .sort((a, b) => new Date(a) - new Date(b))
    .map((date) => ({ date, total: money(grouped[date]) }));
};

/** Quantity and revenue per item, best sellers first. */
export const topProducts = (orders = [], limit = 5) => {
  const totals = new Map();

  orders.forEach((order) => {
    (order.order || []).forEach((line) => {
      const key = line.id || line.itemName;
      if (!key) return;
      const entry =
        totals.get(key) ||
        { id: line.id, itemName: line.itemName, quantity: 0, revenue: 0, unit: baseUnitOf(line.quantityCategory) };
      entry.quantity += lineBaseQuantity(line);
      entry.revenue += num(line.subtotal);
      totals.set(key, entry);
    });
  });

  return Array.from(totals.values())
    .map((entry) => ({ ...entry, revenue: money(entry.revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

/** Revenue split by payment mode, plus how much is still outstanding. */
export const paymentBreakdown = (orders = []) => {
  const result = { Cash: 0, Online: 0, Pending: 0, outstanding: 0 };
  orders.forEach((order) => {
    const mode = order.payment || "Cash";
    result[mode] = money((result[mode] || 0) + num(order.total));
    result.outstanding = money(result.outstanding + num(order.balanceDue));
  });
  return result;
};

/**
 * Gross profit, counting only lines whose product has a cost price recorded.
 * `coverage` says how much of the revenue could actually be measured.
 */
export const grossProfit = (orders = [], products = []) => {
  const costById = new Map(
    products
      .filter((product) => num(product.costPrice) > 0)
      .map((product) => [product.id, num(product.costPrice)])
  );

  let revenue = 0;
  let cost = 0;
  let measuredRevenue = 0;

  orders.forEach((order) => {
    (order.order || []).forEach((line) => {
      const lineRevenue = num(line.subtotal);
      revenue += lineRevenue;
      const unitCost = costById.get(line.id);
      if (unitCost === undefined) return;
      measuredRevenue += lineRevenue;
      cost += unitCost * lineBaseQuantity(line);
    });
  });

  return {
    revenue: money(revenue),
    cost: money(cost),
    profit: money(measuredRevenue - cost),
    coverage: revenue > 0 ? money((measuredRevenue / revenue) * 100) : 0,
  };
};

/** Products at or below their low-stock limit, lowest first. */
export const lowStockProducts = (products = [], threshold = 0) =>
  products
    .map((product) => ({
      ...product,
      stockInBase: productStockInBase(product),
      limit: product.lowStockAt ? num(product.lowStockAt) : num(threshold),
      unit: baseUnitOf(product.quantityCategory),
    }))
    .filter((product) => product.limit > 0 && product.stockInBase <= product.limit)
    .sort((a, b) => a.stockInBase - b.stockInBase);

/** Inventory value at cost and at retail. */
export const inventoryValue = (products = []) =>
  products.reduce(
    (acc, product) => {
      const stock = productStockInBase(product);
      acc.retail = money(acc.retail + stock * num(product.price));
      acc.cost = money(acc.cost + stock * num(product.costPrice));
      return acc;
    },
    { retail: 0, cost: 0 }
  );
