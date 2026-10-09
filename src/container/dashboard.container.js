import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { apiResponse } from "../api";
import { billingFields } from "../description/billingField.description";
import { setOrders as setOrdersAction } from "../store/slice/orderSlice";
import { selectLastSavedCustomer } from "../store/slice/customerSlice";
import {
  selectLastSavedProduct,
  setProducts,
} from "../store/slice/productSlice";
import {
  balanceDue,
  baseUnitOf,
  billingUnitsFor,
  calculateTotals,
  changeDue,
  formatMoney,
  formatQuantity,
  formatStock,
  hasEnoughStock,
  lineBaseQuantity,
  makeCartLine,
  mergeCartLine,
  nextInvoiceNo,
  num,
  productStockInBase,
  stepCartLine,
  stockDeltasBetween,
  toBaseQuantity,
} from "../utils/billing";
import { clearCart, readCart, writeCart } from "../utils/cart";
import { customerForBill, customerForName } from "../utils/customers";
import { notifyDataChanged } from "../utils/dataEvents";
import useSettings from "../utils/useSettings";
import validation from "../utils/validation";

const ORDER_SECTOR = "order";
const CUSTOMER_SECTOR = "customerInfo";

const flatBillingFields = billingFields.flatMap(
  (group) => group.billingFormFields
);

const billingField = (name) =>
  flatBillingFields.find((field) => field.name === name);

/**
 * @param {object} [options]
 * @param {(order: object) => void} [options.onSaved] called with a newly saved
 *   bill instead of the plain "saved" toast, so the screen can offer to share
 *   or print it.
 */
const DashboardContainer = ({ onSaved } = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orderParams = useLocation();
  const { settings } = useSettings();

  const [productList, setProductList] = useState([]);
  const [vendersList, setVendersList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [addData, setAddData] = useState(readCart);
  const [formData, setFormData] = useState({ order: [{}] });
  const [billDate, setBillDate] = useState(dayjs());
  const [formError, setFormError] = useState({});
  const [addNewCustomer, setAddNewCustomer] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef(null);

  const newUser = useSelector(selectLastSavedCustomer);
  const newProduct = useSelector(selectLastSavedProduct);

  /* ------------------------------------------------------------------ load */

  const loadAll = useCallback(async () => {
    try {
      const [products, venders, orderRows] = await Promise.all([
        apiResponse("/product", "GET"),
        apiResponse("/venders", "GET"),
        apiResponse("/orders", "GET"),
      ]);
      setProductList(products.data || []);
      dispatch(setProducts(products.data || []));
      setVendersList(venders.data || []);
      setOrders(orderRows.data || []);
      dispatch(setOrdersAction(orderRows.data || []));
    } catch {
      toast.error(t("toast.loadFailed"));
    }
  }, [dispatch, t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // A product added or edited from a dialog lands in redux first.
  useEffect(() => {
    if (!newProduct?.id) return;
    setProductList((prev) => {
      const index = prev.findIndex((item) => item.id === newProduct.id);
      if (index < 0) return [...prev, newProduct];
      const next = [...prev];
      next[index] = newProduct;
      return next;
    });
  }, [newProduct]);

  // Same for a customer. Guarded because an empty slice used to append a
  // blank entry to the dropdown on every mount.
  useEffect(() => {
    if (!newUser?.id) return;
    setVendersList((prev) => {
      const index = prev.findIndex((vendor) => vendor.id === newUser.id);
      if (index < 0) return [...prev, newUser];
      const next = [...prev];
      next[index] = newUser;
      return next;
    });
  }, [newUser]);

  /* --------------------------------------------------------------- derived */

  const selectedLine = formData.order?.[0] || {};

  const selectedProduct = useMemo(
    () => productList.find((product) => product.id === selectedLine.id),
    [productList, selectedLine.id]
  );

  const invoiceNo = isEditMode
    ? formData.invoiceNo
    : nextInvoiceNo(orders, settings.invoicePrefix);

  const totals = useMemo(
    () =>
      calculateTotals({
        lines: addData,
        gstEnabled: formData.GST === "yes",
        gstRate: settings.gstRate,
        discount: formData.discount,
      }),
    [addData, formData.GST, formData.discount, settings.gstRate]
  );

  const amountPaid =
    formData.payment === "Pending" ? 0 : num(formData.amountPay);
  const change = changeDue(amountPaid, totals.total);
  const balance = balanceDue(amountPaid, totals.total);

  /** Base-unit quantity of `productId` already sitting in the cart. */
  const quantityInCart = useCallback(
    (productId) =>
      addData
        .filter((line) => line.id === productId)
        .reduce((sum, line) => sum + lineBaseQuantity(line), 0),
    [addData]
  );

  const getFieldValue = useCallback(
    (field, index = 0) => {
      const { name, sector } = field;

      switch (name) {
        case "invoiceNo":
          return invoiceNo || "";
        case "subtotal":
          return formatMoney(totals.subtotal);
        case "discountAmount":
          return formatMoney(totals.discountAmount);
        case "GSTAmount":
          return formatMoney(totals.gstAmount);
        case "total":
          return formatMoney(totals.total);
        case "balanceDue":
          return formatMoney(balance);
        case "changeDue":
          return formatMoney(change);
        default:
          break;
      }

      if (sector === ORDER_SECTOR) return formData.order?.[index]?.[name] ?? "";
      if (sector === CUSTOMER_SECTOR) return formData.customerInfo?.[name] ?? "";
      return formData[name] ?? "";
    },
    [formData, totals, balance, change, invoiceNo]
  );

  /* ---------------------------------------------------------------- change */

  const setLineValue = (index, patch) =>
    setFormData((prev) => {
      const order = Array.isArray(prev.order) ? [...prev.order] : [{}];
      order[index] = { ...(order[index] || {}), ...patch };
      return { ...prev, order };
    });

  const check = (name, value) => {
    const field = billingField(name);
    return validation(field.pattern, value, field.label, t);
  };

  /**
   * Make `next` the bill's customer. The name is checked as it changes, and
   * so is the phone when a saved customer's replaces it.
   */
  const setCustomer = (next) => {
    const phoneBefore = formData.customerInfo?.vendorPhone ?? "";
    setFormData((prev) => ({ ...prev, customerInfo: next }));
    setFormError((prev) => ({
      ...prev,
      vendorName: check("vendorName", next.vendorName),
      ...(next.vendorPhone !== phoneBefore && {
        vendorPhone: check("vendorPhone", next.vendorPhone),
      }),
    }));
  };

  /**
   * Typing in Customer Name. What is typed is the bill's customer as it
   * stands, so a new customer saves without Enter or "+ New" first. Item Name
   * is left alone: an item has to be one in stock, so it is picked.
   */
  const handleInputChange = (event, text, reason, field) => {
    if (field?.name !== "vendorName" || reason !== "input") return;
    setCustomer(customerForName(formData.customerInfo, text, vendersList));
  };

  const handleChange = (event, selectedOption, field, index = 0) => {
    // The date picker hands back a dayjs value instead of a DOM event.
    if (dayjs.isDayjs(event)) {
      setBillDate(event);
      return;
    }
    if (!field?.name) return;

    const { name, pattern, label, sector, type } = field;

    /* Autocompletes report the chosen option, or a raw string in freeSolo. */
    if (type === "autoComplete") {
      if (name === "itemName") {
        const chosen =
          typeof selectedOption === "string"
            ? productList.find(
                (product) =>
                  product.itemName?.trim().toLowerCase() ===
                  selectedOption.trim().toLowerCase()
              )
            : productList.find(
                (product) => product.itemName === selectedOption?.itemName
              );

        setFormError((prev) => ({
          ...prev,
          itemName: validation(
            pattern,
            chosen?.itemName ?? selectedOption ?? "",
            label,
            t
          ),
          itemQuantity: undefined,
        }));

        if (!chosen) {
          setLineValue(index, {
            id: undefined,
            itemName:
              typeof selectedOption === "string" ? selectedOption : "",
            price: "",
          });
          return;
        }

        // Selecting a product carries its price and stocking unit across, so
        // a piece-counted item can never be billed by weight.
        setLineValue(index, {
          id: chosen.id,
          itemName: chosen.itemName,
          price: chosen.price,
          costPrice: chosen.costPrice ?? "",
          // For the HSN column of the printed tax invoice.
          hsn: chosen.hsn ?? "",
          quantityCategory: baseUnitOf(chosen.quantityCategory),
        });
        return;
      }

      if (name === "vendorName") {
        // Picked from the list: that saved customer, with their own phone and
        // address (two customers can share a name). Typed and confirmed with
        // Enter, or cleared: the same as typing it.
        setCustomer(
          selectedOption && typeof selectedOption === "object"
            ? {
                vendorName: selectedOption.vendorName ?? "",
                vendorPhone: selectedOption.vendorPhone ?? "",
                address: selectedOption.address ?? "",
              }
            : customerForName(
                formData.customerInfo,
                selectedOption ?? "",
                vendersList
              )
        );
        return;
      }
    }

    if (!event?.target) return;
    const value = event.target.value;

    setFormError((prev) => ({
      ...prev,
      [name]: validation(pattern, value, label, t),
    }));

    /* Route by the field's declared sector. Typing a phone number used to
       land inside the line item because the routing guessed by name. */
    if (sector === CUSTOMER_SECTOR) {
      setFormData((prev) => ({
        ...prev,
        customerInfo: { ...(prev.customerInfo || {}), [name]: value },
      }));
      return;
    }

    if (sector === ORDER_SECTOR) {
      setLineValue(index, { [name]: value });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ------------------------------------------------------------- add a line */

  const handleAddData = (event) => {
    event.preventDefault();

    const line = formData.order?.[0] || {};
    const error = {};

    flatBillingFields
      .filter((field) => field.sector === ORDER_SECTOR && field.pattern)
      .forEach((field) => {
        error[field.name] = validation(
          field.pattern,
          line[field.name],
          field.label,
          t
        );
      });

    const product = productList.find((candidate) => candidate.id === line.id);

    if (!error.itemName && !product) {
      error.itemName = t("errorMsg.unknownItem");
    }

    if (!error.itemQuantity && product) {
      const wanted = toBaseQuantity(line.itemQuantity, line.quantityCategory);
      const alreadyInCart = quantityInCart(product.id);
      if (!hasEnoughStock(product, wanted + alreadyInCart)) {
        const remaining = productStockInBase(product) - alreadyInCart;
        error.itemQuantity = t("errorMsg.stockShort", {
          stock: formatQuantity(Math.max(remaining, 0)),
          unit: baseUnitOf(product.quantityCategory),
        });
      }
    }

    setFormError((prev) => ({ ...prev, ...error }));
    if (!Object.values(error).every((message) => !message)) return;

    const existingIndex = addData.findIndex(
      (candidate) => candidate.id === line.id
    );
    const nextCart =
      existingIndex >= 0
        ? addData.map((candidate, index) =>
            index === existingIndex ? mergeCartLine(candidate, line) : candidate
          )
        : [...addData, makeCartLine(line)];

    writeCart(nextCart);
    setAddData(nextCart);

    // Clear the line entry row but keep the customer and bill settings.
    setFormData((prev) => ({ ...prev, order: [{}] }));
    setFormError((prev) => ({
      ...prev,
      itemName: undefined,
      itemQuantity: undefined,
      price: undefined,
    }));
  };

  /** Base-unit quantity of `productId` in the cart, ignoring one row. */
  const quantityInCartExcept = useCallback(
    (productId, skipIndex) =>
      addData.reduce(
        (sum, line, index) =>
          index === skipIndex || line.id !== productId
            ? sum
            : sum + lineBaseQuantity(line),
        0
      ),
    [addData]
  );

  const commitCart = useCallback((lines) => {
    writeCart(lines);
    setAddData(lines);
  }, []);

  const removeLine = useCallback(
    (index) => commitCart(addData.filter((_, i) => i !== index)),
    [addData, commitCart]
  );

  /**
   * Nudge a row up or down instead of deleting and retyping it. Stepping past
   * zero removes the row; stepping up is still bound by stock.
   */
  const stepLine = useCallback(
    (index, direction) => {
      const line = addData[index];
      if (!line) return;

      const next = stepCartLine(line, direction);
      if (!next) {
        removeLine(index);
        return;
      }

      if (direction > 0) {
        const product = productList.find(
          (candidate) => candidate.id === line.id
        );
        const wanted =
          lineBaseQuantity(next) + quantityInCartExcept(line.id, index);
        if (product && !hasEnoughStock(product, wanted)) {
          toast.error(
            t("errorMsg.stockShortNamed", {
              item: product.itemName,
              stock: formatQuantity(productStockInBase(product)),
              unit: baseUnitOf(product.quantityCategory),
            })
          );
          return;
        }
      }

      commitCart(addData.map((row, i) => (i === index ? next : row)));
    },
    [addData, commitCart, productList, quantityInCartExcept, removeLine, t]
  );

  /* ---------------------------------------------------------------- totals */

  const billPayload = () => ({
    invoiceNo,
    billingDate: billDate.toDate().toISOString(),
    customerInfo: customerForBill(formData.customerInfo, vendersList),
    order: addData,
    subtotal: totals.subtotal,
    discount: num(formData.discount),
    discountAmount: totals.discountAmount,
    GST: formData.GST || "no",
    GSTRate: formData.GST === "yes" ? num(settings.gstRate) : 0,
    GSTAmount: totals.gstAmount,
    GSTNumber: formData.GST === "yes" ? formData.GSTNumber || "" : "",
    payment: formData.payment || "Cash",
    amountPaid,
    changeDue: change,
    balanceDue: balance,
    total: formatMoney(totals.total),
  });

  /* ---------------------------------------------------------------- cancel */

  const resetBill = useCallback(() => {
    clearCart();
    setAddData([]);
    setFormData({ order: [{}] });
    setFormError({});
    setBillDate(dayjs());
  }, []);

  const handleCancel = () => resetBill();

  const handleClearAll = () => {
    resetBill();
    setIsEditMode(false);
    navigate("/");
  };

  /* ------------------------------------------------------------------ save */

  /** Apply base-unit deltas to products and persist each change. */
  const applyStockDeltas = async (deltas) => {
    const updated = [];
    for (const [productId, delta] of deltas.entries()) {
      if (!productId || Math.abs(delta) < 1e-9) continue;
      const product = productList.find(
        (candidate) => candidate.id === productId
      );
      if (!product) continue;
      const stock = formatStock(
        Math.max(productStockInBase(product) + delta, 0)
      );
      await apiResponse(`/product/${productId}`, "PATCH", null, { stock });
      updated.push({ ...product, stock });
    }
    if (updated.length) {
      const merged = productList.map(
        (product) =>
          updated.find((candidate) => candidate.id === product.id) || product
      );
      setProductList(merged);
      dispatch(setProducts(merged));
    }
    return updated;
  };

  const validateBill = () => {
    const error = {};

    if (addData.length === 0) {
      error.itemName = t("description.addOneProduct");
    }

    const customerField = flatBillingFields.find(
      (field) => field.name === "vendorName"
    );
    error.vendorName = validation(
      customerField.pattern,
      formData.customerInfo?.vendorName,
      customerField.label,
      t
    );

    const phoneField = flatBillingFields.find(
      (field) => field.name === "vendorPhone"
    );
    error.vendorPhone = validation(
      phoneField.pattern,
      formData.customerInfo?.vendorPhone,
      phoneField.label,
      t
    );

    if (formData.GST === "yes") {
      const gstField = flatBillingFields.find(
        (field) => field.name === "GSTNumber"
      );
      error.GSTNumber = validation(
        gstField.pattern,
        formData.GSTNumber,
        gstField.label,
        t
      );
    }

    // Over- and underpayment are both allowed: the first becomes change, the
    // second is recorded as a balance due, so neither blocks the sale.

    setFormError((prev) => ({ ...prev, ...error }));

    /** Only the fields that actually failed, so the view can point at them. */
    const failed = Object.fromEntries(
      Object.entries(error).filter(([, message]) => message)
    );
    const first = Object.values(failed)[0];
    // The failing field may be off screen (in the phone's Bill Details sheet,
    // or scrolled away in the desktop panel), so say what is wrong out loud.
    if (first) toast.error(t("toast.fixBeforeSaving", { message: first }));
    return failed;
  };

  /**
   * @returns {Promise<{ok: boolean, errors?: object}>} the fields that blocked
   *   the save, so the phone layout can open the sheet that holds them.
   */
  const handleSave = async () => {
    const errors = validateBill();
    if (Object.keys(errors).length) return { ok: false, errors };

    // Re-check stock against the live product list before taking the money.
    const shortages = [];
    const wanted = new Map();
    addData.forEach((line) => {
      wanted.set(line.id, (wanted.get(line.id) || 0) + lineBaseQuantity(line));
    });
    wanted.forEach((quantity, productId) => {
      const product = productList.find(
        (candidate) => candidate.id === productId
      );
      if (!product || !hasEnoughStock(product, quantity)) {
        shortages.push(
          t("errorMsg.stockShortNamed", {
            item: product?.itemName || productId,
            stock: formatQuantity(productStockInBase(product)),
            unit: baseUnitOf(product?.quantityCategory),
          })
        );
      }
    });
    if (shortages.length) {
      shortages.forEach((message) => toast.error(message));
      return;
    }

    setLoading(true);
    const order = { ...billPayload(), id: String(Date.now()) };
    try {
      const response = await apiResponse("/orders", "POST", null, order);
      if (!response.success) throw new Error("save failed");

      await applyStockDeltas(stockDeltasBetween([], addData));

      const nextOrders = [...orders, order];
      setOrders(nextOrders);
      dispatch(setOrdersAction(nextOrders));
      resetBill();
      notifyDataChanged();
      if (onSaved) onSaved(order);
      else toast.success(t("toast.orderSaved", { invoice: order.invoiceNo }));
      return { ok: true, order };
    } catch {
      toast.error(t("toast.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ edit */

  const editingOrderId = orderParams?.search.replace("?order/", "");

  const editOrder = useCallback(
    (orderID) => {
      const record = orders.find(
        (item) => String(item.id) === String(orderID)
      );
      if (!record) return;

      setIsEditMode(true);
      writeCart(record.order || []);
      setAddData(record.order || []);
      setBillDate(dayjs(record.billingDate));
      setFormData({
        order: [{}],
        invoiceNo: record.invoiceNo,
        customerInfo: record.customerInfo,
        GST: record.GST || "no",
        GSTNumber: record.GSTNumber || "",
        payment: record.payment || "Cash",
        discount: record.discount ?? "",
        amountPay: record.amountPaid ?? "",
      });
    },
    [orders]
  );

  useEffect(() => {
    if (editingOrderId && orders.length) editOrder(editingOrderId);
  }, [editingOrderId, orders, editOrder]);

  const handleUpdate = async () => {
    if (!editingOrderId) {
      toast.error(t("toast.invalidOrder"));
      return;
    }
    const record = orders.find(
      (item) => String(item.id) === String(editingOrderId)
    );
    if (!record) {
      toast.error(t("toast.orderNotFound"));
      return;
    }
    const errors = validateBill();
    if (Object.keys(errors).length) return { ok: false, errors };

    setLoading(true);
    const updated = { ...billPayload(), id: record.id };
    try {
      const response = await apiResponse(
        `/orders/${record.id}`,
        "PATCH",
        null,
        updated
      );
      if (!response.success) throw new Error("update failed");

      // Return what the old bill took, then take what the new one needs. This
      // covers lines that were removed or added, which the previous version
      // silently skipped.
      await applyStockDeltas(stockDeltasBetween(record.order || [], addData));

      const nextOrders = orders.map((item) =>
        String(item.id) === String(record.id) ? updated : item
      );
      setOrders(nextOrders);
      dispatch(setOrdersAction(nextOrders));
      resetBill();
      setIsEditMode(false);
      notifyDataChanged();
      toast.success(t("toast.orderUpdated"));
      navigate("/orders");
    } catch {
      toast.error(t("toast.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------- options */

  const mappedBillingFields = useMemo(
    () =>
      billingFields.map((group) => ({
        ...group,
        billingFormFields: group.billingFormFields.map((field) => {
          if (field.name === "itemName") {
            return {
              ...field,
              options: productList.map((product) => ({
                itemName: product.itemName,
                stock: formatStock(productStockInBase(product)),
                quantityCategory: baseUnitOf(product.quantityCategory),
              })),
            };
          }
          if (field.name === "vendorName") {
            return {
              ...field,
              options: vendersList
                .filter((vendor) => vendor?.name)
                .map((vendor) => ({
                  vendorName: vendor.name,
                  vendorPhone: vendor.phone,
                  address: vendor.address,
                })),
            };
          }
          if (field.name === "quantityCategory") {
            return {
              ...field,
              menu: billingUnitsFor(
                selectedProduct?.quantityCategory ||
                  selectedLine.quantityCategory
              ),
            };
          }
          if (field.name === "GST") {
            return { ...field, label: field.label, gstRate: settings.gstRate };
          }
          return field;
        }),
      })),
    [
      productList,
      vendersList,
      selectedProduct,
      selectedLine.quantityCategory,
      settings.gstRate,
    ]
  );

  const handleAddNew = (sector) =>
    setAddNewCustomer({ show: true, option: sector });
  const closeNewCustomer = () => setAddNewCustomer({ show: false });

  /** Everything the receipt needs, whether or not the bill is saved yet. */
  const receiptData = { ...billPayload(), order: addData };

  return {
    mappedBillingFields,
    getFieldValue,
    handleSave,
    handleAddData,
    handleCancel,
    addData,
    setAddData,
    stepLine,
    removeLine,
    formData,
    formError,
    billDate,
    handleChange,
    handleInputChange,
    handleAddNew,
    addNewCustomer,
    closeNewCustomer,
    componentRef,
    isEditMode,
    handleUpdate,
    handleClearAll,
    loading,
    totals,
    receiptData,
    settings,
  };
};

export default DashboardContainer;
