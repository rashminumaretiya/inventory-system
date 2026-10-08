import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { apiResponse } from "../api";
import { productFields } from "../description/productFields.description";
import { productSaved, selectProducts } from "../store/slice/productSlice";
import { baseUnitOf, formatStock, num } from "../utils/billing";
import validation from "../utils/validation";

const emptyForm = { quantityCategory: "Kg" };

const AddProductContainer = ({ onSaved } = {}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const [error, setError] = useState({});
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleChange = (event, pattern, sName, val, label) => {
    const name = event?.target?.name || sName;
    const value = event?.target ? event.target.value : val;
    setError((prev) => ({
      ...prev,
      [name]: validation(pattern, value, label, t),
    }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (event) => {
    event.preventDefault();

    const nextError = {};
    productFields.forEach((field) => {
      if (!field.pattern) return;
      nextError[field.name] = validation(
        field.pattern,
        formData[field.name],
        field.label,
        t
      );
    });

    const name = formData.itemName?.trim();
    if (!nextError.itemName && name) {
      const duplicate = products.some(
        (product) =>
          product.itemName?.trim().toLowerCase() === name.toLowerCase()
      );
      if (duplicate) nextError.itemName = t("errorMsg.duplicateProduct");
    }

    setError(nextError);
    if (!Object.values(nextError).every((message) => !message)) return;

    // A product is stocked either by weight (Kg) or by count (Pcs.); grams are
    // a billing convenience only, so nothing needs converting here.
    const payload = {
      id: String(Date.now()),
      itemName: name,
      price: String(num(formData.price)),
      costPrice: formData.costPrice ? String(num(formData.costPrice)) : "",
      quantityCategory: baseUnitOf(formData.quantityCategory),
      stock: formatStock(formData.stock),
      lowStockAt: formData.lowStockAt ? String(num(formData.lowStockAt)) : "",
      hsn: String(formData.hsn ?? "").trim(),
    };

    setSaving(true);
    try {
      const response = await apiResponse("/product", "POST", null, payload);
      if (!response.success) throw new Error("save failed");
      dispatch(productSaved(response.data?.id ? response.data : payload));
      toast.success(t("toast.productAdded", { name: payload.itemName }));
      setFormData(emptyForm);
      setError({});
      onSaved?.();
    } catch {
      toast.error(t("toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return { handleChange, handleAddProduct, error, formData, saving, t };
};

export default AddProductContainer;
