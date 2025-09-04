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
    type: "number",
    label: "formLabel.phoneNumber",
    md: 12,
    pattern: "phoneNumber",
  },
  {
    name: "address",
    type: "text",
    label: "formLabel.customerAddress",
    md: 12,
    rows: 2,
    multiline: true,
    pattern: "notEmpty",
  },
];
