import { money, num } from "./billing";

/**
 * Settling credit ("khata") after the sale.
 *
 * A bill records what was collected at the till, but a shopkeeper is often paid
 * days later. Without this the balance on a bill could never go down, so a
 * pending-payment alert would stay forever.
 */

export const PAYMENT_MODES = ["Cash", "Online"];

/**
 * What a bill still owes. Newer bills carry `balanceDue`; bills saved before
 * that field existed are treated as fully outstanding when marked Pending.
 */
export const orderOutstanding = (order) => {
  if (order?.balanceDue !== undefined && order?.balanceDue !== null) {
    return money(order.balanceDue);
  }
  return order?.payment === "Pending" ? money(order.total) : 0;
};

export const isSettled = (order) => orderOutstanding(order) <= 0;

/** Bills that still owe something, oldest first — the order they get paid in. */
export const unpaidOrders = (orders = []) =>
  orders
    .filter((order) => orderOutstanding(order) > 0)
    .sort(
      (a, b) => new Date(a.billingDate).getTime() - new Date(b.billingDate).getTime()
    );

/** A customer is identified by phone when there is one, else by name. */
export const customerKeyOf = (order) =>
  order?.customerInfo?.vendorPhone?.trim() ||
  order?.customerInfo?.vendorName?.trim() ||
  "";

/** The same key for a saved customer record, so it lines up with its bills. */
export const customerKeyOfRecord = (customer) =>
  customer?.phone?.trim() || customer?.name?.trim() || "";

export const ordersForCustomer = (orders = [], key) =>
  orders.filter((order) => customerKeyOf(order) === key);

/**
 * What each customer still owes, as a Map of customer key ->
 * { amount, bills }. Only customers who owe something appear.
 */
export const duesByCustomer = (orders = []) => {
  const dues = new Map();
  orders.forEach((order) => {
    const owed = orderOutstanding(order);
    if (owed <= 0) return;
    const key = customerKeyOf(order);
    const entry = dues.get(key) || { amount: 0, bills: 0 };
    dues.set(key, { amount: money(entry.amount + owed), bills: entry.bills + 1 });
  });
  return dues;
};

export const totalOutstanding = (orders = []) =>
  money(orders.reduce((sum, order) => sum + orderOutstanding(order), 0));

/**
 * Apply a payment to one bill.
 * Never accepts more than is owed, so a bill cannot go into credit.
 *
 * @returns {{applied: number, changes: object}} the amount taken and the
 *   fields to persist. `changes` is empty when nothing could be applied.
 */
export const applyPayment = (order, amount, mode = "Cash", at = new Date()) => {
  const due = orderOutstanding(order);
  const applied = money(Math.min(Math.max(num(amount), 0), due));
  if (applied <= 0) return { applied: 0, changes: null };

  const amountPaid = money(num(order.amountPaid) + applied);
  const balanceDue = money(Math.max(num(order.total) - amountPaid, 0));

  return {
    applied,
    changes: {
      amountPaid,
      balanceDue,
      // A receipt history, so the shopkeeper can see when money came in.
      payments: [
        ...(Array.isArray(order.payments) ? order.payments : []),
        { at: new Date(at).toISOString(), amount: applied, mode },
      ],
      // Once nothing is owed the bill is no longer Pending.
      payment:
        balanceDue <= 0 && order.payment === "Pending" ? mode : order.payment,
    },
  };
};

/**
 * Spread one lump sum across a customer's unpaid bills, oldest first — how a
 * shopkeeper actually clears a khata ("Jay gave 1000, settle what you can").
 *
 * @returns {{allocations: Array, allocated: number, unallocated: number}}
 *   `unallocated` is what could not be applied because nothing was left owing.
 */
export const allocatePayment = (
  orders = [],
  amount,
  mode = "Cash",
  at = new Date()
) => {
  let remaining = money(Math.max(num(amount), 0));
  const allocations = [];

  for (const order of unpaidOrders(orders)) {
    if (remaining <= 0) break;
    const { applied, changes } = applyPayment(order, remaining, mode, at);
    if (!changes) continue;
    remaining = money(remaining - applied);
    allocations.push({ order, applied, changes });
  }

  return {
    allocations,
    allocated: money(num(amount) - remaining),
    unallocated: remaining,
  };
};

/** Every payment taken after the sale, newest first — for a customer history. */
export const paymentHistory = (orders = []) =>
  orders
    .flatMap((order) =>
      (order.payments || []).map((payment) => ({
        ...payment,
        invoiceNo: order.invoiceNo,
        orderId: order.id,
      }))
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
