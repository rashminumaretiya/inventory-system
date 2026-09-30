import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import { apiResponse } from "../api";
import { productSaved } from "../store/slice/productSlice";
import {
  addStock,
  baseUnitOf,
  billingUnitsFor,
  formatQuantity,
  num,
  productStockInBase,
} from "../utils/billing";
import { notifyDataChanged } from "../utils/dataEvents";
import validation from "../utils/validation";

const StockInContainer = ({ product, onSaved } = {}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const baseUnit = baseUnitOf(product?.quantityCategory);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(baseUnit);
  const [costPrice, setCostPrice] = useState("");
  const [error, setError] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setQuantity("");
    setUnit(baseUnitOf(product?.quantityCategory));
    setCostPrice(product?.costPrice ?? "");
    setError({});
  }, [product]);

  const units = useMemo(
    () => billingUnitsFor(product?.quantityCategory),
    [product]
  );

  const current = productStockInBase(product);
  /** Live preview, so the shopkeeper sees the shelf total before saving. */
  const projected = quantity ? num(addStock(product, quantity, unit)) : current;

  const handleSave = async (event) => {
    event.preventDefault();

    const nextError = {
      quantity: validation("positiveNumber", quantity, "formLabel.received", t),
    };
    setError(nextError);
    if (nextError.quantity) return;

    const payload = { stock: addStock(product, quantity, unit) };
    // Restocking is the natural moment to correct a changed buying price.
    if (String(costPrice).trim() !== "") {
      payload.costPrice = String(num(costPrice));
    }

    setSaving(true);
    try {
      const response = await apiResponse(
        `/product/${product.id}`,
        "PATCH",
        null,
        payload
      );
      if (!response.success) throw new Error("stock in failed");
      dispatch(productSaved({ ...product, ...payload }));
      notifyDataChanged();
      toast.success(
        t("toast.stockAdded", {
          quantity: formatQuantity(quantity),
          unit,
          name: product.itemName,
        })
      );
      onSaved?.();
    } catch {
      toast.error(t("toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return {
    quantity,
    setQuantity,
    unit,
    setUnit,
    units,
    costPrice,
    setCostPrice,
    baseUnit,
    current,
    projected,
    error,
    saving,
    handleSave,
    t,
  };
};

export default StockInContainer;
