export const customerFields = [
  {
    name: "name",
    type: "text",
    label: "formLabel.customerName",
    option: "",
    md: 12,
    pattern: "notEmpty",
  },
  {
    name: "phone",
    type: "text",
    label: "formLabel.phoneNumber",
    md: 12,
    pattern: "phoneNumber",
  },
  {
    // Walk-in customers often have no address on file.
    name: "address",
    type: "text",
    label: "formLabel.customerAddress",
    md: 12,
    rows: 2,
    multiline: true,
  },
];
