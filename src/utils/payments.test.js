import {
  allocatePayment,
  applyPayment,
  customerKeyOf,
  customerKeyOfRecord,
  duesByCustomer,
  isSettled,
  orderOutstanding,
  ordersForCustomer,
  paymentHistory,
  totalOutstanding,
  unpaidOrders,
} from "./payments";

const bill = (over = {}) => ({
  id: "o1",
  invoiceNo: "DT_1",
  billingDate: "2026-09-01T00:00:00.000Z",
  total: "500.00",
  payment: "Pending",
  amountPaid: 0,
  balanceDue: 500,
  customerInfo: { vendorName: "Jay", vendorPhone: "9876543100" },
  ...over,
});

describe("orderOutstanding", () => {
  it("uses balanceDue when present", () => {
    expect(orderOutstanding(bill({ balanceDue: 120 }))).toBe(120);
    expect(orderOutstanding(bill({ balanceDue: 0, payment: "Cash" }))).toBe(0);
  });

  it("treats a legacy Pending bill as fully unpaid", () => {
    expect(orderOutstanding({ payment: "Pending", total: "250.00" })).toBe(250);
  });

  it("is settled when nothing is owed", () => {
    expect(isSettled(bill({ balanceDue: 0 }))).toBe(true);
    expect(isSettled(bill())).toBe(false);
  });
});

describe("applyPayment", () => {
  it("reduces the balance and records the receipt", () => {
    const { applied, changes } = applyPayment(bill(), 200, "Cash", "2026-09-10");
    expect(applied).toBe(200);
    expect(changes.amountPaid).toBe(200);
    expect(changes.balanceDue).toBe(300);
    expect(changes.payments).toHaveLength(1);
    expect(changes.payments[0]).toMatchObject({ amount: 200, mode: "Cash" });
  });

  it("clears Pending once the bill is fully paid", () => {
    const { changes } = applyPayment(bill(), 500, "Online");
    expect(changes.balanceDue).toBe(0);
    expect(changes.payment).toBe("Online");
  });

  it("leaves an already-paid bill's status alone", () => {
    const partly = bill({ payment: "Cash", amountPaid: 100, balanceDue: 400 });
    const { changes } = applyPayment(partly, 400);
    expect(changes.balanceDue).toBe(0);
    expect(changes.payment).toBe("Cash");
  });

  it("never takes more than is owed", () => {
    const { applied, changes } = applyPayment(bill(), 900);
    expect(applied).toBe(500);
    expect(changes.balanceDue).toBe(0);
    expect(changes.amountPaid).toBe(500);
  });

  it("ignores a zero or negative amount", () => {
    expect(applyPayment(bill(), 0).changes).toBeNull();
    expect(applyPayment(bill(), -50).changes).toBeNull();
  });

  it("appends to an existing payment history", () => {
    const seen = bill({
      amountPaid: 100,
      balanceDue: 400,
      payments: [{ at: "2026-09-05T00:00:00.000Z", amount: 100, mode: "Cash" }],
    });
    const { changes } = applyPayment(seen, 50);
    expect(changes.payments).toHaveLength(2);
    expect(changes.amountPaid).toBe(150);
  });
});

describe("allocatePayment", () => {
  const orders = [
    bill({ id: "a", invoiceNo: "DT_1", billingDate: "2026-09-01", total: "500.00", balanceDue: 500 }),
    bill({ id: "b", invoiceNo: "DT_2", billingDate: "2026-09-20", total: "300.00", balanceDue: 300 }),
    bill({ id: "c", invoiceNo: "DT_3", billingDate: "2026-09-10", total: "200.00", balanceDue: 0, payment: "Cash" }),
  ];

  it("clears the oldest bill first", () => {
    const { allocations } = allocatePayment(orders, 500);
    expect(allocations).toHaveLength(1);
    expect(allocations[0].order.invoiceNo).toBe("DT_1");
    expect(allocations[0].changes.balanceDue).toBe(0);
  });

  it("carries the remainder onto the next bill", () => {
    const { allocations, allocated, unallocated } = allocatePayment(orders, 650);
    expect(allocations.map((a) => a.order.invoiceNo)).toEqual(["DT_1", "DT_2"]);
    expect(allocations[1].applied).toBe(150);
    expect(allocations[1].changes.balanceDue).toBe(150);
    expect(allocated).toBe(650);
    expect(unallocated).toBe(0);
  });

  it("reports money it could not place", () => {
    const { allocated, unallocated } = allocatePayment(orders, 1000);
    expect(allocated).toBe(800);
    expect(unallocated).toBe(200);
  });

  it("skips bills that are already settled", () => {
    const { allocations } = allocatePayment(orders, 800);
    expect(allocations.map((a) => a.order.invoiceNo)).not.toContain("DT_3");
  });

  it("does nothing when there is nothing owing", () => {
    const settled = [bill({ balanceDue: 0, payment: "Cash" })];
    const { allocations, unallocated } = allocatePayment(settled, 100);
    expect(allocations).toEqual([]);
    expect(unallocated).toBe(100);
  });
});

describe("customer grouping", () => {
  const orders = [
    bill({ id: "a", balanceDue: 500 }),
    bill({
      id: "b",
      balanceDue: 120,
      customerInfo: { vendorName: "Abhi", vendorPhone: "9812121212" },
    }),
    bill({ id: "c", balanceDue: 80 }),
  ];

  it("keys a customer by phone, falling back to name", () => {
    expect(customerKeyOf(orders[0])).toBe("9876543100");
    expect(customerKeyOf({ customerInfo: { vendorName: "Walk in" } })).toBe("Walk in");
  });

  it("collects a customer's bills and totals what they owe", () => {
    const jay = ordersForCustomer(orders, "9876543100");
    expect(jay.map((o) => o.id)).toEqual(["a", "c"]);
    expect(totalOutstanding(jay)).toBe(580);
  });

  it("lists unpaid bills oldest first", () => {
    const list = unpaidOrders([
      bill({ id: "new", billingDate: "2026-09-20", balanceDue: 10 }),
      bill({ id: "old", billingDate: "2026-09-01", balanceDue: 10 }),
    ]);
    expect(list.map((o) => o.id)).toEqual(["old", "new"]);
  });
});

describe("paymentHistory", () => {
  it("lists receipts newest first with their invoice", () => {
    const orders = [
      bill({
        invoiceNo: "DT_1",
        payments: [{ at: "2026-09-05T00:00:00.000Z", amount: 100, mode: "Cash" }],
      }),
      bill({
        invoiceNo: "DT_2",
        payments: [{ at: "2026-09-09T00:00:00.000Z", amount: 50, mode: "Online" }],
      }),
    ];
    const history = paymentHistory(orders);
    expect(history.map((p) => p.invoiceNo)).toEqual(["DT_2", "DT_1"]);
  });

  it("is empty when no one has paid late", () => {
    expect(paymentHistory([bill()])).toEqual([]);
  });
});

describe("customerKeyOfRecord", () => {
  it("keys a saved customer the same way as their bills", () => {
    const customer = { name: "Jay", phone: " 9876543100 " };
    expect(customerKeyOfRecord(customer)).toBe(customerKeyOf(bill()));
  });

  it("falls back to the name when there is no phone", () => {
    expect(customerKeyOfRecord({ name: " Abhi ", phone: "" })).toBe("Abhi");
    expect(customerKeyOfRecord(undefined)).toBe("");
  });
});

describe("duesByCustomer", () => {
  it("adds up what each customer owes and on how many bills", () => {
    const dues = duesByCustomer([
      bill({ id: "o1", balanceDue: 300 }),
      bill({ id: "o2", balanceDue: 200.5 }),
      bill({ id: "o3", balanceDue: 0, payment: "Cash" }),
      bill({
        id: "o4",
        balanceDue: 50,
        customerInfo: { vendorName: "Abhi", vendorPhone: "" },
      }),
    ]);

    expect(dues.get("9876543100")).toEqual({ amount: 500.5, bills: 2 });
    expect(dues.get("Abhi")).toEqual({ amount: 50, bills: 1 });
  });

  it("leaves out customers who owe nothing", () => {
    expect(duesByCustomer([bill({ balanceDue: 0, payment: "Cash" })]).size).toBe(0);
  });
});
