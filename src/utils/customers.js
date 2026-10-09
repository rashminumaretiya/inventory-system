/**
 * The customer on a bill, whether picked from the saved list or typed in.
 *
 * A bill does not need a saved customer: a name typed by hand is a new (or
 * walk-in) customer and is saved on the bill as it is. A name that matches a
 * saved customer brings that customer's phone and address, as picking them
 * from the list would.
 */

const comparable = (name) => String(name ?? "").trim().toLowerCase();

/**
 * The one saved customer with this name, ignoring case and stray spaces.
 * Two saved customers who share a name are told apart by picking from the
 * list, so a typed name that matches both brings neither.
 */
export const savedCustomerNamed = (customers = [], name) => {
  const wanted = comparable(name);
  if (!wanted) return undefined;
  const matches = customers.filter(
    (customer) => comparable(customer?.name) === wanted
  );
  return matches.length === 1 ? matches[0] : undefined;
};

/**
 * The bill's customer once the name box reads `name`.
 *
 * The name is kept exactly as typed, spaces and all, because the box is still
 * being typed in. A saved customer's name brings their phone and address. Any
 * other name keeps the phone and address entered so far, except ones that came
 * from a saved customer whose name has just been typed over: those were that
 * customer's, not the new one's.
 */
export const customerForName = (before = {}, name, customers = []) => {
  const saved = savedCustomerNamed(customers, name);
  if (saved) {
    return {
      ...before,
      vendorName: name,
      vendorPhone: saved.phone ?? "",
      address: saved.address ?? "",
    };
  }

  const previous = savedCustomerNamed(customers, before.vendorName);
  const kept = (key, savedKey) =>
    previous && (before[key] ?? "") === (previous[savedKey] ?? "")
      ? ""
      : (before[key] ?? "");

  return {
    ...before,
    vendorName: name,
    vendorPhone: kept("vendorPhone", "phone"),
    address: kept("address", "address"),
  };
};

/**
 * The customer as the bill records them: the name trimmed, and spelt as saved
 * when it is a saved customer's, so their bills and dues line up.
 */
export const customerForBill = (info, customers = []) => {
  if (!info) return info;
  const name = String(info.vendorName ?? "").trim();
  return {
    ...info,
    vendorName: savedCustomerNamed(customers, name)?.name?.trim() ?? name,
  };
};
