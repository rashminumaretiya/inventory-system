import { textMatches } from "./transliterate";

/** How many of each kind a search lists; the rest is one more letter away. */
export const RESULT_LIMIT = 5;

const digitsOf = (value) => String(value ?? "").replace(/\D/g, "");

/** Names that start with what was typed come first, then A to Z. */
const byName = (term) => {
  const lower = term.toLowerCase();
  const rank = (text) =>
    String(text ?? "").toLowerCase().startsWith(lower) ? 0 : 1;
  return (a, b) =>
    rank(a) - rank(b) || String(a ?? "").localeCompare(String(b ?? ""));
};

/**
 * Items, customers and bills matching `query`, grouped and capped at `limit`
 * each. Names match across scripts (see textMatches), so "pot" typed in
 * Gujarati still finds Potato. A phone number matches from three digits on,
 * a bill also by its invoice number, and bills come newest first.
 */
export const searchEverything = ({
  query,
  products = [],
  customers = [],
  orders = [],
  limit = RESULT_LIMIT,
}) => {
  const term = String(query ?? "").trim();
  if (!term) return { products: [], customers: [], bills: [] };

  const lower = term.toLowerCase();
  const digits = digitsOf(term);
  const phoneMatches = (phone) =>
    digits.length >= 3 && digitsOf(phone).includes(digits);
  const nameOrder = byName(term);

  return {
    products: products
      .filter(
        (product) => product?.itemName && textMatches(product.itemName, term),
      )
      .sort((a, b) => nameOrder(a.itemName, b.itemName))
      .slice(0, limit),
    customers: customers
      .filter(
        (customer) =>
          customer?.name &&
          (textMatches(customer.name, term) || phoneMatches(customer.phone)),
      )
      .sort((a, b) => nameOrder(a.name, b.name))
      .slice(0, limit),
    bills: orders
      .filter(
        (order) =>
          String(order?.invoiceNo ?? "").toLowerCase().includes(lower) ||
          textMatches(order?.customerInfo?.vendorName, term) ||
          phoneMatches(order?.customerInfo?.vendorPhone),
      )
      .sort(
        (a, b) =>
          new Date(b.billingDate).getTime() - new Date(a.billingDate).getTime(),
      )
      .slice(0, limit),
  };
};

/**
 * Actions whose name contains what was typed, in any of the labels
 * `labelsOf(action)` gives — the app's language and English — so "bill"
 * finds "New bill" even while the app is in Gujarati.
 */
export const matchActions = (actions, query, labelsOf) => {
  const term = String(query ?? "").trim();
  if (!term) return actions;
  return actions.filter((action) =>
    labelsOf(action).some((label) => textMatches(label, term)),
  );
};
