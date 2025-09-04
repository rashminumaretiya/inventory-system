import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { billingFields } from "../description/billingField.description";
import validation from "../utils/validation";
import { ApiContainer } from "../api";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { productData } from "../store/slice/productSlice";
import { useTranslation } from "react-i18next";

const DashboardContainer = () => {
  const { apiResponse } = ApiContainer();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [productList, setProductList] = useState([]);
  const [vendersList, setVendersList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({});
  const [billDate, setBillDate] = useState(dayjs());
  const [addData, setAddData] = useState(
    JSON.parse(localStorage.getItem("formData")) || []
  );
  const [formError, setFormError] = useState({});
  const [addNewCustomer, setAddNewCustomer] = useState({});
  const componentRef = useRef(null);
  const orderParams = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const newUser = useSelector((state) => state?.customer?.user || []);
  const newProduct = useSelector((state) => state?.product?.product || []);

  const getProduct = async () => {
    try {
      const response = await apiResponse("/product", "GET");
      if (response.success) {
        setProductList(response.data);
        dispatch(productData({ payload: response.data }));
      }
    } catch {
      toast.error("Something went wrong");
    }
  };
  const getVenders = async () => {
    try {
      const response = await apiResponse("/venders", "GET");
      if (response.success) {
        setVendersList(response.data);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    if (newProduct) {
      setProductList(newProduct);
    }
  }, [newProduct]);

  useEffect(() => {
    if (newUser) {
      const newVenderList = [...vendersList, newUser];
      setVendersList(newVenderList);
    }
  }, [newUser]);

  const getOrder = async () => {
    try {
      const response = await apiResponse("/orders", "GET");
      if (response.success) {
        setOrders(response.data);
      }
    } catch {
      toast.error("Something went wrong while fetching orders");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([getProduct(), getOrder(), getVenders()]);
    };
    fetchData();
  }, []);

  const handleChange = (e, pattern, sName, val, label, index) => {
    if (e.target) {
      const { name, value } = e.target;
      const selectedName = name || sName;
      const selectedValue = value || val;

      const item = productList?.find((el) => el.itemName === val?.itemName);
      const vendor = vendersList?.find((el) => el.name === val?.vendorName);
      const isVendorChange = selectedName === "vendorName";
      const isItemChange = selectedName === "itemName";
      const isMethod = ["GST", "GSTNumber", "payment", "amountPay"].includes(
        selectedName
      );

      setFormError((prev) => ({
        ...prev,
        [selectedName]: validation(pattern, selectedValue, label, t),
      }));

      setFormData((prev) => ({
        ...prev,
        ...(isMethod && {
          [selectedName]: selectedValue,
        }),
        ...(isVendorChange && {
          customerInfo: {
            vendorName: vendor?.name,
            vendorPhone: vendor?.phone,
            address: vendor?.address,
          },
        }),
        ...(!isVendorChange &&
          !isMethod && {
            order:
              prev?.order > 0
                ? prev?.order?.map((data, i) => {
                    if (i === index) {
                      return {
                        ...prev?.order[index],
                        id: isItemChange ? item?.id : prev?.order?.[index].id,
                        [selectedName]: isItemChange
                          ? val?.itemName
                          : selectedValue,
                        price: isItemChange
                          ? item?.price
                          : prev.order?.[index].price,
                        quantityCategory: ["Grams", "Kg", "Pcs."].includes(
                          selectedValue
                        )
                          ? selectedValue
                          : formData.order?.[index]?.quantityCategory || "Kg",
                      };
                    }
                    return data;
                  })
                : [
                    {
                      ...prev?.order[index],
                      id: isItemChange ? item?.id : prev?.order?.[index].id,
                      [selectedName]: isItemChange
                        ? val?.itemName
                        : selectedValue,
                      price: isItemChange
                        ? item?.price
                        : prev.order?.[index].price,
                      quantityCategory: ["Grams", "Kg", "Pcs."].includes(
                        selectedValue
                      )
                        ? selectedValue
                        : item?.quantityCategory ||
                          prev.order?.[index].quantityCategory,
                    },
                  ],
          }),
      }));
    }
    if (e?.$d) {
      setBillDate(dayjs(e.$d));
    }
  };

  const handleAddData = (e) => {
    e.preventDefault();
    let error = {};
    const findProduct = productList.find(
      (data) => data.id === formData?.order[0].id
    );
    billingFields.forEach((fields) => {
      fields.billingFormFields.forEach((field) => {
        if (
          field.pattern &&
          field.name !== "vendorName" &&
          field.name !== "GSTNumber"
        ) {
          error[field?.name] = validation(
            field.pattern,
            field.value || formData.order[0][field.name],
            field.label,
            t
          );
        }
        if (field.name === "GSTNumber" && formData.GST === "yes") {
          error[field?.name] = validation(
            field.pattern,
            formData?.GSTNumber,
            field.label,
            t
          );
        }
        if (field.name === "itemQuantity") {
          if (formData?.order[0].itemQuantity <= 0) {
            error[field?.name] = "Quantity must be 1 or more";
          }
          if (formData?.order[0].quantityCategory === "Pcs.") {
            if (
              Number(findProduct?.stock) <
              Number(formData?.order[0].itemQuantity)
            ) {
              error[field?.name] = "Stock quantity not available";
            }
          } else {
            if (
              Number(findProduct?.stock * 1000) <
              Number(formData?.order[0].itemQuantity)
            ) {
              error[field?.name] = "Stock quantity not available";
            }
          }
        }
      });
    });

    setFormError((prev) => ({
      ...prev,
      ...error,
    }));
    if (Object.values(error).every((el) => el === undefined)) {
      const existingData = JSON.parse(localStorage.getItem("formData")) || [];
      const duplicateData = existingData.find(
        (el) => el.id === formData.order[0].id
      );
      if (duplicateData) {
        const updatedData = existingData.map((data) => {
          if (data.id === formData.order[0].id) {
            let updatedQuantity = null;
            if (
              data.quantityCategory === "Grams" &&
              formData.order[0].quantityCategory === "Kg"
            ) {
              updatedQuantity =
                +data.itemQuantity / 1000 + +formData.order[0].itemQuantity;
            } else if (
              data.quantityCategory === "Kg" &&
              formData.order[0].quantityCategory === "Grams"
            ) {
              updatedQuantity =
                +data.itemQuantity + +formData.order[0].itemQuantity / 1000;
            } else if (formData.order[0].quantityCategory === "Grams") {
              updatedQuantity =
                +data.itemQuantity + +formData.order[0].itemQuantity;
            } else {
              updatedQuantity =
                +data.itemQuantity + +formData.order[0].itemQuantity;
            }

            return {
              ...data,
              itemQuantity: (data.quantityCategory !== "Pcs." &&
              updatedQuantity >= 1000
                ? updatedQuantity / 1000
                : updatedQuantity
              ).toFixed(2),
              quantityCategory:
                data.quantityCategory !== "Pcs." && updatedQuantity >= 1000
                  ? "Kg"
                  : data.quantityCategory,
              subtotal: (data.quantityCategory === "Grams"
                ? (updatedQuantity / 1000) * formData.order[0].price
                : updatedQuantity * formData.order[0].price
              ).toFixed(2),
            };
          }
          return data;
        });
        localStorage.setItem("formData", JSON.stringify(updatedData));
        setAddData(updatedData);
      } else {
        existingData?.push({
          ...formData.order[0],
          itemQuantity:
            formData.order[0].quantityCategory !== "Pcs." &&
            formData.order[0].itemQuantity >= 1000
              ? formData.order[0].itemQuantity / 1000
              : formData.order[0].itemQuantity,
          quantityCategory:
            formData.order[0].quantityCategory !== "Pcs." &&
            formData.order[0].itemQuantity >= 1000
              ? "Kg"
              : formData.order[0].quantityCategory,
          subtotal: (formData.order[0].quantityCategory === "Grams"
            ? (formData.order[0].price / 1000) * formData.order[0].itemQuantity
            : formData.order[0].itemQuantity * formData.order[0].price
          ).toFixed(2),
        });
        localStorage.setItem("formData", JSON.stringify(existingData));
        setAddData(existingData);
      }
      setFormData((prev) => ({
        ...prev,
        invoiceNo: isEditMode ? formData.invoiceNo : "DT_1",
        billingDate: isEditMode ? formData.billingDate : billDate.$d,
        order: [{}],
        subtotal: formData.subtotal,
        customerInfo: formData.customerInfo,
        total: formData.total,
      }));
    }
  };

  useEffect(() => {
    const subtotal = addData?.reduce((acc, val) => acc + +val.subtotal, 0);

    const invoice = orders.map((data) => data.invoiceNo);

    const gstAmount = formData.GST === "yes" ? (subtotal * 18) / 100 : 0;
    setFormData((prev) => ({
      ...prev,
      invoiceNo: isEditMode
        ? formData.invoiceNo
        : invoice?.length
        ? `DT_${invoice?.length + 1}`
        : "DT_1",
      billingDate: billDate.$d,
      subtotal: subtotal,
      order: Array.isArray(prev.order) ? [...prev.order] : [{}],
      GST: formData.GST || "no",
      payment: formData.payment || "Cash",
      GSTAmount: gstAmount,
      total: (gstAmount !== 0 ? subtotal + gstAmount : subtotal).toFixed(2),
    }));
  }, [
    addData,
    formData.invoiceNo,
    formData.payment,
    formData.GST,
    billDate,
    orders,
    isEditMode,
  ]);

  const handleCancel = () => {
    setFormData((prev) => ({
      invoiceNo: prev?.invoiceNo,
      billingDate: billDate.$d,
      order: [{}],
      subtotal: formData.subtotal,
      total: formData.total,
      payment: "Cash",
    }));
    setAddData([]);
    localStorage.removeItem("formData");
  };
  const handleClearAll = () => {
    localStorage.removeItem("formData");
    handleCancel();
    setIsEditMode(false);
    setAddData([]);
    navigate("/");
  };

  const handleSave = async () => {
    let error = {};
    billingFields.forEach((fields) => {
      fields.billingFormFields.forEach((field) => {
        if (field.pattern && field.name === "vendorName") {
          error[field?.name] = validation(
            field.pattern,
            field.value || formData?.customerInfo?.[field.name],
            field.label,
            t
          );
        }
        if (field.name === "GSTNumber" && formData.GST === "yes") {
          error[field?.name] = validation(
            field.pattern,
            field.value || formData?.GSTNumber,
            field.label,
            t
          );
        }
        if (addData.length === 0) {
          error["itemName"] = t("description.addOneProduct");
        }
      });
    });

    setFormError((prev) => ({
      ...prev,
      ...error,
    }));
    if (Object.values(error).every((el) => el === undefined)) {
      setLoading(true);
      const updatedRecords = productList
        .filter((el) => addData.some((item) => item.id === el.id))
        .map((el) => {
          const matchedItem = addData.find((item) => item.id === el.id);
          return {
            ...el,
            stock: (matchedItem.quantityCategory === "Kg"
              ? (+el.stock * 1000 - matchedItem.itemQuantity * 1000) / 1000
              : matchedItem.quantityCategory === "Grams"
              ? (+el.stock * 1000 - matchedItem.itemQuantity) / 1000
              : +el.stock - matchedItem.itemQuantity
            ).toFixed(3),
          };
        });
      const updatedProductList = productList.map((el) => {
        const matchedRecord = updatedRecords.find(
          (record) => record.id === el.id
        );
        return matchedRecord ? { ...matchedRecord } : el;
      });
      const order = { ...formData, order: addData };
      const matchedRecord = productList.filter((data) => {
        return addData.some((record) => record.id === data.id);
      });
      let isStockValid = true;
      matchedRecord.forEach((record) => {
        const stockInfo = addData.find((data) => data.id === record.id);
        const quantityCategoryMultiplier =
          stockInfo.quantityCategory === "Pcs." ? 1 : 1000;
        const requiredStock =
          (+stockInfo.itemQuantity * quantityCategoryMultiplier) /
          (stockInfo.quantityCategory === "Grams" ? 1000 : 1);
        const availableStock = record.stock * quantityCategoryMultiplier;
        if (requiredStock > availableStock) {
          isStockValid = false;
          toast.error(
            `${stockInfo.itemName} quantity must be less than ${record.stock}`
          );
          setLoading(false);
        }
      });
      if (isStockValid) {
        try {
          const response = await apiResponse("/orders", "POST", null, {
            ...order,
            id: Date.now(),
          });
          if (response.success) {
            const updatePromises = updatedRecords.map((record) => {
              return apiResponse(`/product/${record.id}`, "PATCH", null, {
                stock: record.stock,
              });
            });
            const updateResponses = await Promise.all(updatePromises);
            if (updateResponses.every((res) => res)) {
              toast.success("Order saved successfully");
              localStorage.removeItem("formData");
              setAddData([]);
              setFormData(() => ({
                order: [{}],
              }));
              dispatch(productData({ payload: updatedProductList }));
              setLoading(false);
            }
          }
        } catch {
          toast.error("Something went wrong");
          setLoading(false);
        }
      }
    }
  };
  const mappedBillingFields = billingFields.map((billingField) => {
    const updatedFields = billingField.billingFormFields.map((field) => {
      if (field.name === "itemName") {
        return {
          ...field,
          options: productList?.map((product) => ({
            itemName: product.itemName,
            stock: product.stock,
            quantityCategory: product.quantityCategory,
          })),
        };
      } else if (field.name === "vendorName") {
        return {
          ...field,
          options: vendersList?.map((vendor) => ({
            vendorName: vendor?.name,
            vendorPhone: vendor?.phone,
            address: vendor?.address,
          })),
        };
      }
      return field;
    });

    return {
      ...billingField,
      billingFormFields: updatedFields,
    };
  });

  const handleAddNew = (sector) => {
    setAddNewCustomer({ show: true, option: sector });
  };
  const closeNewCustomer = () => {
    setAddNewCustomer({ show: false });
  };
  const editOrder = useCallback(
    (orderID) => {
      setIsEditMode(true);
      if (orders.length > 0 && Number(orderID)) {
        const editOrderRecord = orders.find(
          (item) => Number(item.id) === Number(orderID)
        );
        if (!editOrderRecord) {
          toast.error("Order not found");
          return;
        }
        localStorage.setItem(
          "formData",
          JSON.stringify(editOrderRecord?.order)
        );
        setFormData({ ...editOrderRecord, order: [] });
        setBillDate(dayjs(editOrderRecord?.billingDate));
        setAddData(editOrderRecord?.order);
      }
    },
    [orders]
  );

  useEffect(() => {
    const orderID = orderParams?.search.replace("?order/", "");
    if (orderID) {
      editOrder(orderID);
    }
  }, [orders, orderParams, editOrder]);

  const handleUpdate = async () => {
    const orderID = orderParams?.search.replace("?order/", "");
    if (!orderID || isNaN(orderID)) {
      toast.error("Invalid order ID");
      return;
    }
    const updateRecord = { ...formData, order: addData };
    const editOrderRecord = orders.find(
      (item) => Number(item.id) === Number(orderID)
    );
    if (!editOrderRecord) {
      toast.error("Order not found");
      return;
    }
    const matchRecord = editOrderRecord?.order
      .filter((el) => addData.some((item) => Number(item.id) === Number(el.id)))
      .map((data) => {
        const matched = addData.find((item) => item.id === data.id);
        if (matched.itemQuantity !== data.itemQuantity) {
          const product = productList.find(
            (product) => Number(product.id) === Number(matched.id)
          );
          if (product) {
            const updatedStock = (
              product.stock -
              (matched.itemQuantity - data.itemQuantity)
            ).toFixed(3);
            return { id: matched.id, stock: updatedStock };
          }
        }
        return null;
      })
      .filter(Boolean);
    try {
      const response = await apiResponse(`/orders/${orderID}`, "PATCH", null, {
        ...updateRecord,
        invoiceNo: updateRecord.invoiceNo,
        id: editOrderRecord.id,
      });
      if (response.success) {
        const updatePromises = matchRecord?.map((record) => {
          return apiResponse(`/product/${record.id}`, "PATCH", null, {
            stock: record.stock,
          });
        });
        const updateResponses = await Promise.all(updatePromises);
        if (updateResponses.every((res) => res)) {
          toast.success("Updated order successfully");
          localStorage.removeItem("formData");
          setIsEditMode(false);
          navigate("/orders");
        }
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  return {
    mappedBillingFields,
    handleSave,
    handleAddData,
    handleCancel,
    addData,
    setAddData,
    formData,
    formError,
    billDate,
    handleChange,
    handleAddNew,
    addNewCustomer,
    closeNewCustomer,
    componentRef,
    isEditMode,
    handleUpdate,
    handleClearAll,
    loading,
  };
};

export default DashboardContainer;
