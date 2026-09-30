import {
  balanceDue,
  baseUnitOf,
  billingUnitsFor,
  calculateTotals,
  changeDue,
  hasEnoughStock,
  lineSubtotal,
  makeCartLine,
  mergeCartLine,
  nextInvoiceNo,
  stockDeltasBetween,
  toBaseQuantity,
} from "./billing";

const chilli = { id: "c", itemName: "Chilli", price: "20" }; // Rs 20 per Kg
const waffer = { id: "w", itemName: "Waffer", price: "10" }; // Rs 10 per piece

describe("cart lines", () => {
  it("prices a sub-kilo weight line in grams", () => {
    const line = makeCartLine({
      ...chilli,
      itemQuantity: "500",
      quantityCategory: "Grams",
    });
    expect(line.itemQuantity).toBe("500");
    expect(line.quantityCategory).toBe("Grams");
    expect(line.subtotal).toBe("10.00");
  });

  it("merges grams into kilos without losing a factor of 1000", () => {
    const line = makeCartLine({
      ...chilli,
      itemQuantity: "500",
      quantityCategory: "Grams",
    });
    const merged = mergeCartLine(line, {
      ...chilli,
      itemQuantity: "1",
      quantityCategory: "Kg",
    });
    expect(merged.itemQuantity).toBe("1.5");
    expect(merged.quantityCategory).toBe("Kg");
    expect(merged.subtotal).toBe("30.00");
  });

  it("merges kilos into grams", () => {
    const line = makeCartLine({
      ...chilli,
      itemQuantity: "2",
      quantityCategory: "Kg",
    });
    const merged = mergeCartLine(line, {
      ...chilli,
      itemQuantity: "500",
      quantityCategory: "Grams",
    });
    expect(merged.subtotal).toBe("50.00");
    expect(merged.quantityCategory).toBe("Kg");
  });

  it("promotes grams to kilos once the line passes 1 Kg", () => {
    const line = makeCartLine({
      ...chilli,
      itemQuantity: "600",
      quantityCategory: "Grams",
    });
    const merged = mergeCartLine(line, {
      ...chilli,
      itemQuantity: "700",
      quantityCategory: "Grams",
    });
    expect(merged.itemQuantity).toBe("1.3");
    expect(merged.quantityCategory).toBe("Kg");
    expect(merged.subtotal).toBe("26.00");
  });

  it("merges counted items", () => {
    const line = makeCartLine({
      ...waffer,
      itemQuantity: "3",
      quantityCategory: "Pcs.",
    });
    const merged = mergeCartLine(line, {
      ...waffer,
      itemQuantity: "2",
      quantityCategory: "Pcs.",
    });
    expect(merged.itemQuantity).toBe("5");
    expect(merged.subtotal).toBe("50.00");
  });
});

describe("line subtotals match the orders already in the database", () => {
  it.each([
    [{ price: "20", itemQuantity: "20", quantityCategory: "Grams" }, 0.4],
    [{ price: "50", itemQuantity: "10", quantityCategory: "Kg" }, 500],
    [{ price: "11", itemQuantity: "2", quantityCategory: "Kg" }, 22],
    [{ price: "120", itemQuantity: "10", quantityCategory: "Pcs." }, 1200],
  ])("%p -> %p", (line, expected) => {
    expect(lineSubtotal(line)).toBe(expected);
  });
});

describe("bill totals", () => {
  it("adds GST and rounds it to paise", () => {
    const totals = calculateTotals({
      lines: [{ subtotal: "0.40" }, { subtotal: "500.00" }],
      gstEnabled: true,
      gstRate: 18,
    });
    expect(totals.subtotal).toBe(500.4);
    expect(totals.gstAmount).toBe(90.07);
    expect(totals.total).toBe(590.47);
  });

  it("applies discount before GST", () => {
    const totals = calculateTotals({
      lines: [{ subtotal: "1000.00" }],
      gstEnabled: true,
      gstRate: 18,
      discount: 100,
    });
    expect(totals.taxable).toBe(900);
    expect(totals.gstAmount).toBe(162);
    expect(totals.total).toBe(1062);
  });

  it("charges no GST when GST is off", () => {
    const totals = calculateTotals({ lines: [{ subtotal: "42.00" }] });
    expect(totals.gstAmount).toBe(0);
    expect(totals.total).toBe(42);
  });

  it("clamps the discount to the subtotal", () => {
    expect(calculateTotals({ lines: [{ subtotal: "50" }], discount: 9999 }).total).toBe(0);
    expect(calculateTotals({ lines: [{ subtotal: "50" }], discount: -20 }).total).toBe(50);
  });
});

describe("cash handling", () => {
  it("returns change and never a negative", () => {
    expect(changeDue(600, 590.47)).toBe(9.53);
    expect(changeDue(100, 590.47)).toBe(0);
  });

  it("tracks an outstanding balance", () => {
    expect(balanceDue(100, 590.47)).toBe(490.47);
    expect(balanceDue(600, 590.47)).toBe(0);
  });
});

describe("invoice numbers", () => {
  it("never reuses a number after a deletion", () => {
    const orders = [
      { invoiceNo: "DT_1" },
      { invoiceNo: "DT_2" },
      { invoiceNo: "DT_4" },
      { invoiceNo: "DT_5" },
    ];
    expect(nextInvoiceNo(orders)).toBe("DT_6");
  });

  it("starts at one and ignores unparseable numbers", () => {
    expect(nextInvoiceNo([])).toBe("DT_1");
    expect(nextInvoiceNo([{ invoiceNo: "abc" }, { invoiceNo: "DT_9" }])).toBe("DT_10");
  });
});

describe("units and stock", () => {
  it("treats a legacy Grams product as stocked in Kg", () => {
    expect(baseUnitOf("Grams")).toBe("Kg");
  });

  it("offers grams only to weight items", () => {
    expect(billingUnitsFor("Kg")).toEqual(["Kg", "Grams"]);
    expect(billingUnitsFor("Pcs.")).toEqual(["Pcs."]);
  });

  it("compares stock in the base unit", () => {
    expect(hasEnoughStock({ stock: "1.860" }, toBaseQuantity(500, "Grams"))).toBe(true);
    expect(hasEnoughStock({ stock: "1.860" }, toBaseQuantity(2, "Kg"))).toBe(false);
    expect(hasEnoughStock({ stock: "1.860" }, toBaseQuantity(1860, "Grams"))).toBe(true);
  });
});

describe("stockDeltasBetween", () => {
  const line = (id, itemQuantity, quantityCategory = "Kg") => ({
    id,
    itemQuantity,
    quantityCategory,
    price: "10",
  });

  it("takes stock out for a brand new bill", () => {
    const deltas = stockDeltasBetween([], [line("p1", "2")]);
    expect(deltas.get("p1")).toBe(-2);
  });

  it("returns stock when a bill is deleted", () => {
    const deltas = stockDeltasBetween([line("p1", "2")], []);
    expect(deltas.get("p1")).toBe(2);
  });

  it("ignores an unchanged line", () => {
    const deltas = stockDeltasBetween([line("p1", "2")], [line("p1", "2")]);
    expect(deltas.has("p1")).toBe(false);
  });

  it("moves only the difference when a quantity changes", () => {
    const deltas = stockDeltasBetween([line("p1", "2")], [line("p1", "5")]);
    expect(deltas.get("p1")).toBe(-3);
  });

  it("gives stock back when a quantity is reduced", () => {
    const deltas = stockDeltasBetween([line("p1", "5")], [line("p1", "2")]);
    expect(deltas.get("p1")).toBe(3);
  });

  it("handles a line removed from an edited order", () => {
    const deltas = stockDeltasBetween(
      [line("p1", "2"), line("p2", "3")],
      [line("p1", "2")]
    );
    expect(deltas.get("p2")).toBe(3);
    expect(deltas.has("p1")).toBe(false);
  });

  it("handles a line added to an edited order", () => {
    const deltas = stockDeltasBetween(
      [line("p1", "2")],
      [line("p1", "2"), line("p3", "4")]
    );
    expect(deltas.get("p3")).toBe(-4);
  });

  it("converts units before comparing, so grams do not read as kilos", () => {
    const deltas = stockDeltasBetween(
      [line("p1", "500", "Grams")],
      [line("p1", "1", "Kg")]
    );
    expect(deltas.get("p1")).toBe(-0.5);
  });
});
