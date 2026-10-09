import { customerForBill, customerForName, savedCustomerNamed } from "./customers";

const saved = [
  { id: "v-jay", name: "Jay", phone: "9876543100", address: "Bhavani circle" },
  { id: "v-raju", name: "Raju", phone: "9812121212", address: "" },
  { id: "v-ravi-1", name: "Ravi", phone: "9000000001", address: "Adajan" },
  { id: "v-ravi-2", name: "ravi ", phone: "9000000002", address: "Vesu" },
];

describe("savedCustomerNamed", () => {
  it("finds a saved customer whatever the case or stray spaces", () => {
    expect(savedCustomerNamed(saved, "  jAY ")?.id).toBe("v-jay");
  });

  it("finds nobody for a new name, a blank one, or part of a name", () => {
    expect(savedCustomerNamed(saved, "Ramesh")).toBeUndefined();
    expect(savedCustomerNamed(saved, "   ")).toBeUndefined();
    expect(savedCustomerNamed(saved, "Raj")).toBeUndefined();
  });

  it("leaves two customers who share a name to be picked from the list", () => {
    expect(savedCustomerNamed(saved, "Ravi")).toBeUndefined();
  });
});

describe("customerForName", () => {
  it("keeps a new name exactly as typed, with the phone already entered", () => {
    const before = { vendorName: "Ramesh", vendorPhone: "9898989898", address: "" };
    expect(customerForName(before, "Ramesh ", saved)).toEqual({
      vendorName: "Ramesh ",
      vendorPhone: "9898989898",
      address: "",
    });
  });

  it("brings a saved customer's phone and address when their name is typed", () => {
    expect(customerForName({}, "jay", saved)).toEqual({
      vendorName: "jay",
      vendorPhone: "9876543100",
      address: "Bhavani circle",
    });
  });

  it("drops a saved customer's details once their name is typed over", () => {
    const jay = { vendorName: "Jay", vendorPhone: "9876543100", address: "Bhavani circle" };
    expect(customerForName(jay, "Jaydeep", saved)).toEqual({
      vendorName: "Jaydeep",
      vendorPhone: "",
      address: "",
    });
  });

  it("keeps details that were changed by hand after picking", () => {
    const edited = { vendorName: "Jay", vendorPhone: "9876543100", address: "Varachha" };
    expect(customerForName(edited, "Jaydeep", saved)).toEqual({
      vendorName: "Jaydeep",
      vendorPhone: "",
      address: "Varachha",
    });
  });
});

describe("customerForBill", () => {
  it("trims a typed name and spells a saved customer's as saved", () => {
    expect(customerForBill({ vendorName: " Ramesh  ", vendorPhone: "" }, saved)).toEqual({
      vendorName: "Ramesh",
      vendorPhone: "",
    });
    expect(customerForBill({ vendorName: "jay", vendorPhone: "9876543100" }, saved).vendorName).toBe("Jay");
  });

  it("leaves a bill with no customer yet as it is", () => {
    expect(customerForBill(undefined, saved)).toBeUndefined();
  });
});
