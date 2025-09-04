export const productFields = [
  {
    name: "itemName",
    type: "text",
    label: "description.item_name",
    md: 12,
    pattern: "notEmpty",
  },
  {
    name: "price",
    type: "number",
    label: "description.price",
    md: 4,
    pattern: "notEmpty",
  },
  {
    name: "stock",
    type: "text",
    label: "formLabel.stockQuantity",
    md: 4,
    pattern: "notEmpty",
  },
  {
    label: "formLabel.stockCategory",
    name: "quantityCategory",
    type: "select",
    defaultValue: "Kg",
    menu: ["Kg", "Grams", "Pcs."],
    md: 4,
  },
];
