/**
 * Single source of truth for quantity, unit and money maths.
 *
 * Storage model
 * -------------
 * A product is stocked and priced in exactly one base unit:
 *   - weight items  -> base unit "Kg"   (price is per Kg, stock is in Kg)
 *   - counted items -> base unit "Pcs." (price is per piece, stock is in pieces)
 *
 * While billing, a weight item may be entered in "Grams" for convenience; the
 * value is converted to Kg before it touches stock or money. Legacy products
 * saved with quantityCategory "Grams" already hold their stock in Kg, so they
 * are normalised to "Kg" on read.
 */

export const KG = "Kg";
export const GRAMS = "Grams";
export const PCS = "Pcs.";

export const GRAMS_PER_KG = 1000;

/** Units that may be typed into a bill line for a weight item. */
export const WEIGHT_UNITS = [KG, GRAMS];

/** True when the unit measures weight rather than a count. */
export const isWeightUnit = (unit) => WEIGHT_UNITS.includes(unit);

/**
 * The base unit a product is stocked and priced in.
 * Legacy "Grams" products stored their stock in Kg, so they collapse to Kg.
 */
export const baseUnitOf = (unit) => (unit === PCS ? PCS : KG);

/** Units a bill line may use for a product stocked in `unit`. */
export const billingUnitsFor = (unit) =>
  baseUnitOf(unit) === PCS ? [PCS] : WEIGHT_UNITS;

/** Coerce anything numeric-ish to a finite number, else 0. */
export const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Convert a typed quantity into the product's base unit.
 * 250 Grams -> 0.25 (Kg); 2 Kg -> 2; 3 Pcs. -> 3.
 */
export const toBaseQuantity = (quantity, unit) =>
  unit === GRAMS ? num(quantity) / GRAMS_PER_KG : num(quantity);

/** Convert a base-unit quantity back into `unit`. */
export const fromBaseQuantity = (baseQuantity, unit) =>
  unit === GRAMS ? num(baseQuantity) * GRAMS_PER_KG : num(baseQuantity);

/**
 * Pick the friendliest unit for a base quantity, so a cart shows
 * "250 Grams" rather than "0.25 Kg" but still shows "1.5 Kg".
 */
export const displayUnitFor = (baseQuantity, unit) => {
  if (baseUnitOf(unit) === PCS) return PCS;
  return Math.abs(num(baseQuantity)) < 1 ? GRAMS : KG;
};

/** Round to `dp` decimals without float dust (0.145 -> 0.15, not 0.14). */
export const round = (value, dp = 2) => {
  const factor = 10 ** dp;
  return Math.round((num(value) + Number.EPSILON) * factor) / factor;
};

/** Money is always 2 decimals. */
export const money = (value) => round(value, 2);

/** Format money for display, e.g. "1450.00". */
export const formatMoney = (value) => money(value).toFixed(2);

/** Stock keeps 3 decimals so grams stay representable in Kg. */
export const formatStock = (value) => round(value, 3).toFixed(3);

/**
 * Quantities print without trailing zero noise: 2, 2.5, 250.
 */
export const formatQuantity = (value) => {
  const rounded = round(value, 3);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

/**
 * Line total for a bill row. `price` is per base unit.
 * 20 Grams of a Rs.20/Kg item -> 0.40
 */
export const lineSubtotal = ({ price, itemQuantity, quantityCategory }) =>
  money(toBaseQuantity(itemQuantity, quantityCategory) * num(price));

/**
 * Build a normalised cart line. Accepts whatever the form produced and
 * returns display quantity/unit plus a correct subtotal.
 */
export const makeCartLine = (line, baseQuantityOverride) => {
  const productUnit = baseUnitOf(line.quantityCategory);
  const baseQuantity =
    baseQuantityOverride !== undefined
      ? num(baseQuantityOverride)
      : toBaseQuantity(line.itemQuantity, line.quantityCategory);

  const displayUnit = displayUnitFor(baseQuantity, productUnit);
  const displayQuantity = round(fromBaseQuantity(baseQuantity, displayUnit), 3);

  return {
    ...line,
    itemQuantity: formatQuantity(displayQuantity),
    quantityCategory: displayUnit,
    baseQuantity: round(baseQuantity, 4),
    baseUnit: productUnit,
    subtotal: formatMoney(baseQuantity * num(line.price)),
  };
};

/** Base-unit quantity a cart line consumes from stock. */
export const lineBaseQuantity = (line) =>
  line?.baseQuantity !== undefined && line?.baseQuantity !== null
    ? num(line.baseQuantity)
    : toBaseQuantity(line?.itemQuantity, line?.quantityCategory);

/** Merge an incoming line into an existing cart line of the same product. */
export const mergeCartLine = (existing, incoming) =>
  makeCartLine(
    { ...existing, price: incoming.price ?? existing.price },
    lineBaseQuantity(existing) + lineBaseQuantity(incoming)
  );

/**
 * Bill totals. Discount is applied to the subtotal before GST, which is how
 * an Indian retail invoice is calculated.
 */
export const calculateTotals = ({
  lines = [],
  gstEnabled = false,
  gstRate = 18,
  discount = 0,
}) => {
  const subtotal = money(
    lines.reduce((sum, line) => sum + num(line.subtotal), 0)
  );
  const discountAmount = money(Math.min(Math.max(num(discount), 0), subtotal));
  const taxable = money(subtotal - discountAmount);
  const gstAmount = gstEnabled ? money((taxable * num(gstRate)) / 100) : 0;
  const total = money(taxable + gstAmount);

  return { subtotal, discountAmount, taxable, gstAmount, total };
};

/** Change owed back to the customer, never negative. */
export const changeDue = (amountPaid, total) =>
  money(Math.max(num(amountPaid) - num(total), 0));

/** Outstanding balance on a part-paid bill, never negative. */
export const balanceDue = (amountPaid, total) =>
  money(Math.max(num(total) - num(amountPaid), 0));

/**
 * Next invoice number: highest numeric suffix already used, plus one.
 * Robust against deleted orders, which `length + 1` was not.
 */
export const nextInvoiceNo = (orders = [], prefix = "DT") => {
  const highest = orders.reduce((max, order) => {
    const match = String(order?.invoiceNo || "").match(/(\d+)\s*$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}_${highest + 1}`;
};

/** Stock is held in the product's base unit. */
export const productStockInBase = (product) => num(product?.stock);

/** Is there enough stock for `baseQuantity` of this product? */
export const hasEnoughStock = (product, baseQuantity) =>
  productStockInBase(product) + 1e-9 >= num(baseQuantity);

/** Human-readable stock, e.g. "1.86 Kg" or "120 Pcs." */
export const describeStock = (product) => {
  const unit = baseUnitOf(product?.quantityCategory);
  return `${formatQuantity(productStockInBase(product))} ${unit}`;
};

/**
 * Net stock movement needed to replace bill `before` with bill `after`,
 * as a Map of productId -> signed base-unit delta to ADD to stock.
 *
 * A removed line yields a positive delta (stock comes back), a new line a
 * negative one (stock goes out), and an unchanged line cancels to zero. The
 * earlier implementation only walked lines present in both bills, so items
 * added to or removed from an edited order never moved stock at all.
 */
export const stockDeltasBetween = (before = [], after = []) => {
  const deltas = new Map();

  const add = (line, sign) => {
    if (!line?.id) return;
    deltas.set(line.id, (deltas.get(line.id) || 0) + sign * lineBaseQuantity(line));
  };

  before.forEach((line) => add(line, 1));
  after.forEach((line) => add(line, -1));

  // Drop float dust so an unchanged line does not trigger a pointless write.
  deltas.forEach((delta, id) => {
    if (Math.abs(delta) < 1e-9) deltas.delete(id);
    else deltas.set(id, round(delta, 4));
  });

  return deltas;
};
