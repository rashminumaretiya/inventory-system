export const productFields = [
  {
    name: "itemName",
    type: "text",
    label: "description.item_name",
    md: 12,
    pattern: "notEmpty",
  },
  {
    // Selling price, per Kg for weight items or per piece for counted ones.
    name: "price",
    type: "number",
    label: "description.price",
    md: 4,
    pattern: "positiveNumber",
    inputProps: { min: 0, step: "any" },
  },
  {
    // Optional, but without it the reports cannot show profit.
    name: "costPrice",
    type: "number",
    label: "formLabel.costPrice",
    md: 4,
    inputProps: { min: 0, step: "any" },
  },
  {
    label: "formLabel.stockCategory",
    name: "quantityCategory",
    type: "select",
    defaultValue: "Kg",
    // A product is stocked either by weight (Kg) or by count (Pcs.).
    // Grams remains available at billing time only.
    menu: ["Kg", "Pcs."],
    md: 4,
  },
  {
    name: "stock",
    type: "number",
    label: "formLabel.stockQuantity",
    md: 6,
    pattern: "nonNegative",
    inputProps: { min: 0, step: "any" },
  },
  {
    name: "lowStockAt",
    type: "number",
    label: "formLabel.lowStockAt",
    md: 6,
    inputProps: { min: 0, step: "any" },
  },
];
