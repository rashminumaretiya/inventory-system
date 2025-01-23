export const productFields = [
  {
    name: "itemName",
    type: "text",
    label: "Item Name",
    md: 12,
    pattern: "notEmpty",
  },
  {
    name: "price",
    type: "number",
    label: "Price",
    md: 4,
    pattern: "notEmpty",
  },
  {
    name: "stock",
    type: "text",
    label: "Stock Quantity",
    md: 4,
    pattern: "notEmpty",
  },
  {
    label: "Stock Category",
    name: "quantityCategory",
    type: "select",
    defaultValue: "Kg",
    menu: ["Kg", "Grams", "Pcs."],
    md: 4,
  },
];
