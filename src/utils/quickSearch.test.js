import { matchActions, searchEverything } from "./quickSearch";
import { toGujarati } from "./transliterate";

const products = [
  { id: "p1", itemName: "Sweet Potato" },
  { id: "p2", itemName: "Potato" },
  { id: "p3", itemName: "ધાણાદાળ" },
  { id: "p4", itemName: "Waffer" },
];

const customers = [
  { id: "c1", name: "Jay Patel", phone: "9876543100" },
  { id: "c2", name: "Abhi", phone: "9812121212" },
  { id: "c3", name: "રમેશ", phone: "" },
];

const orders = [
  {
    id: "o1",
    invoiceNo: "DT_1",
    billingDate: "2026-09-01T00:00:00.000Z",
    customerInfo: { vendorName: "Jay Patel", vendorPhone: "9876543100" },
  },
  {
    id: "o2",
    invoiceNo: "DT_12",
    billingDate: "2026-10-01T00:00:00.000Z",
    customerInfo: { vendorName: "Abhi", vendorPhone: "9812121212" },
  },
  {
    id: "o3",
    invoiceNo: "DT_13",
    billingDate: "2026-10-02T00:00:00.000Z",
    customerInfo: { vendorName: "Jay Patel", vendorPhone: "9876543100" },
  },
];

const search = (query, limit) =>
  searchEverything({ query, products, customers, orders, limit });

const ids = (rows) => rows.map((row) => row.id);

describe("searchEverything", () => {
  it("finds nothing for an empty query", () => {
    expect(search("  ")).toEqual({ products: [], customers: [], bills: [] });
  });

  it("finds items by part of the name, those starting with it first", () => {
    expect(ids(search("pot").products)).toEqual(["p2", "p1"]);
  });

  it("finds an English item typed in Gujarati, and a Gujarati one typed in English", () => {
    expect(ids(search(toGujarati("pot")).products)).toEqual(["p2", "p1"]);
    expect(ids(search("dhaaNaa").products)).toEqual(["p3"]);
    expect(ids(search("ramesh").customers)).toEqual(["c3"]);
  });

  it("finds customers by three or more digits of their phone", () => {
    expect(ids(search("98121").customers)).toEqual(["c2"]);
    expect(search("98").customers).toEqual([]);
  });

  it("finds bills by invoice number, newest first", () => {
    expect(ids(search("DT_1").bills)).toEqual(["o3", "o2", "o1"]);
    expect(ids(search("dt_12").bills)).toEqual(["o2"]);
  });

  it("finds a customer's bills by their name or phone", () => {
    expect(ids(search("jay").bills)).toEqual(["o3", "o1"]);
    expect(ids(search("43100").bills)).toEqual(["o3", "o1"]);
  });

  it("caps each group at the limit", () => {
    expect(search("DT", 2).bills).toHaveLength(2);
  });
});

describe("matchActions", () => {
  const actions = [{ id: "newBill" }, { id: "lock" }];
  const labels = {
    newBill: ["નવું બિલ", "New bill"],
    lock: ["હમણાં લોક કરો", "Lock the till"],
  };
  const labelsOf = (action) => labels[action.id];

  it("lists every action when nothing is typed", () => {
    expect(matchActions(actions, "", labelsOf)).toEqual(actions);
  });

  it("matches the English name while the app is in Gujarati", () => {
    expect(matchActions(actions, "bill", labelsOf)).toEqual([actions[0]]);
  });

  it("matches the Gujarati name too", () => {
    expect(matchActions(actions, "લોક", labelsOf)).toEqual([actions[1]]);
  });
});
