export const customerFields = [
  {
    name: "name",
    type: "text",
    label: "Vendor Name",
    option: "",
    md: 12,
    pattern: "notEmpty",
  },
  {
    name: "phone",
    type: "number",
    label: "Phone Number",
    md: 12,
    pattern: "phoneNumber",
  },
  {
    name: "address",
    type: "text",
    label: "Vendor Address",
    md: 12,
    rows: 2,
    multiline: true,
    pattern: "notEmpty",
  },
];
