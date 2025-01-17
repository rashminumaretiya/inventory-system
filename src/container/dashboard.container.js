import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { billingFields } from "../description/billingField.description";
import validation from "../utils/validation";
import { ApiContainer } from "../api";
import { useReactToPrint } from "react-to-print";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { productData } from "../store/slice/productSlice";

const DashboardContainer = () => {
  const { apiResponse } = ApiContainer();
  const navigate = useNavigate()
  const [productList, setProductList] = useState([]);
  const [vendersList, setVendersList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({});
  const [billDate, setBillDate] = useState(dayjs());
  const [addData, setAddData] = useState(
    JSON.parse(localStorage.getItem("formData")) || []
  );
  const [orderIndex, setOrderIndex] = useState(0);
  const [formError, setFormError] = useState({});
  const [addNewCustomer, setAddNewCustomer] = useState({});
  const componentRef = useRef(null);
  const orderParams = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const dispatch = useDispatch()

  const newUser = useSelector((state) => state?.customer?.user || [])
  const newProduct = useSelector((state) => state?.product?.product || [])
  

  const getProduct = async () => {
    try {
      const response = await apiResponse("/product", "GET");
      if (response) {
        setProductList(response.data);
        dispatch(productData({payload: response.data}))
      }
    } catch {
      toast.error("Something went wrong");
    }
  };
  const getVenders = async () => {
    try {
      const response = await apiResponse("/venders", "GET");
      if (response) {
        setVendersList(response.data);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
   if(newProduct){
    setProductList(newProduct);
   }
  }, [newProduct])

  useEffect(() => {
   if(newUser){
    const newVenderList = [...vendersList, newUser]
    setVendersList(newVenderList);
   }
  }, [newUser])

  const getOrder = async () => {
    try {
      const response = await apiResponse("/orders", "GET");
      if (response) {
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
    fetchData()
  }, []);

  const handleChange = (e, pattern, sName, val, label, index) => {
    if (e.target) {
      const { name, value } = e.target;
      const selectedName = name || sName;
      const selectedValue = value || val;

      const item = productList?.find((el) => el.itemName === selectedValue?.itemName);
      const vender = vendersList?.find((el) => el.name === selectedValue);
      const isVendorChange = selectedName === "vendorName";
      const isMethod = ["GST", "GSTNumber", "payment", "amountPay"].includes(
        selectedName
      );
      setFormError((prev) => ({
        ...prev,
        [selectedName]: validation(pattern, selectedValue, label),
      }));
      setFormData((prev) => ({
        ...prev,
        ...(isMethod && {
          [selectedName]: selectedValue,
        }),
        ...(isVendorChange && {
          customerInfo: {
            [selectedName]: selectedValue,
            vendorPhone: vender?.phone,
            address: vender?.address,
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
                        id:
                          selectedName === "itemName"
                            ? item?.id
                            : prev?.order?.[index].id,
                        [selectedName]: selectedName === "itemName" ? selectedValue.itemName : selectedValue,
                        price:
                          selectedName === "itemName"
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
                      id:
                        selectedName === "itemName"
                          ? item?.id
                          : prev?.order?.[index].id,
                      [selectedName]: selectedName === "itemName" ? selectedValue?.itemName : selectedValue,
                      price:
                        selectedName === "itemName"
                          ? item?.price
                          : prev.order?.[index].price,
                      quantityCategory: ["Grams", "Kg", "Pcs."].includes(
                        selectedValue
                      )
                        ? selectedValue
                        : formData.order?.[index]?.quantityCategory || "Kg",
                    },
                  ],
          }),
      }));
    }
    e.$d && setBillDate(dayjs(e.$d))
  };

  console.log('formData', formData)

  const handleAddData = (e) => {
    e.preventDefault();
    let error = {};
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
            field.label
          );
        }
        if (field.name === "GSTNumber" && formData.GST === "yes") {
          error[field?.name] = validation(
            field.pattern,
            formData?.GSTNumber,
            field.label
          );
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
                +data.itemQuantity + +formData.order[0].itemQuantity / 1000;
            } else {
              updatedQuantity =
                +data.itemQuantity + +formData.order[0].itemQuantity;
            }

            return {
              ...data,
              itemQuantity: updatedQuantity,
              subtotal: (updatedQuantity * formData.order[0].price).toFixed(2),
            };
          }
          return data;
        });
        localStorage.setItem("formData", JSON.stringify(updatedData));
        setAddData(updatedData);
      } else {
        existingData?.push({
          ...formData.order[0],
          subtotal:
            formData.order[0].quantityCategory === "Grams"
              ? (formData.order[0].price / 1000) *
                formData.order[0].itemQuantity
              : formData.order[0].itemQuantity * formData.order[0].price,
        });
        localStorage.setItem("formData", JSON.stringify(existingData));
        setAddData(existingData);
      }

      setFormData({
        invoiceNo:isEditMode ? formData.invoiceNo: "DT_1",
        billingDate: isEditMode ? formData.billingDate: billDate.$d,
        subtotal: formData.subtotal,
        customerInfo: formData.customerInfo,
        total: formData.total,
      });
    }
  }  
   
  useEffect(() => {
      const subtotal = addData?.reduce((acc, val) => acc + +val.subtotal, 0);
  
      const invoice = orders.map((data) => data.invoiceNo);
  
      const gstAmount = formData.GST === "yes" ? (subtotal * 18) / 100 : 0;
      setFormData((prev) => ({
        ...prev,
        invoiceNo: isEditMode ? formData.invoiceNo : invoice.length ? `DT_${invoice.length + 1}` : "DT_1",
        billingDate: billDate.$d,
        subtotal: subtotal,
        order: Array.isArray(prev.order) ? [...prev.order] : [{}],
        GST: formData.GST || 'no',
        payment: formData.payment || 'Cash',
        GSTAmount: gstAmount,
        total: gstAmount !== 0 ? subtotal + gstAmount : subtotal,
      }));
      
  }, [addData, formData.invoiceNo, formData.payment, formData.GST, billDate, orders, isEditMode]);


  const handleCancel = () => {
    setFormData((prev) => ({
      invoiceNo: prev?.invoiceNo,
      billingDate: billDate.$d,
      order: [{}],
      subtotal: formData.subtotal,
      total: formData.total,
      payment: "Cash",
    }));
  };
  const handleClearAll = () => {
    localStorage.clear()
    handleCancel()
    setIsEditMode(false);
    setAddData([]);
    navigate('/')
  };
  
  const handleSave = async () => {
    let error = {};
    billingFields.forEach((fields) => {
      fields.billingFormFields.forEach((field) => {
        if (field.pattern && field.name === "vendorName") {
          error[field?.name] = validation(
            field.pattern,
            field.value || formData?.customerInfo?.[field.name],
            field.label
          );
        }
        if (field.name === "GSTNumber" && formData.GST === "yes") {
          error[field?.name] = validation(
            field.pattern,
            field.value || formData?.GSTNumber,
            field.label
          );
        }
        if (addData.length === 0) {
          error["itemName"] = "Please add at least one product";
        }
      });
    });

    setFormError((prev) => ({
      ...prev,
      ...error,
    }));
    if (Object.values(error).every((el) => el === undefined)) {
      const order = { ...formData, order: addData };
      try {
        const response = await apiResponse("/orders", "POST", null, {
          ...order,
          id: Date.now(),
        });
        if (response) {
          toast.success("Order saved successfully");
          localStorage.removeItem("formData");
          setAddData([]);
          setFormData((prev) => ({
            order: [{}],
          }));
          getOrder();
        }
      } catch {
        toast.error("Something went wrong");
      }
    }
  };

  const mappedBillingFields = billingFields.map((billingField) => {
    const updatedFields = billingField.billingFormFields.map((field) => {
      if (field.name === "itemName") {
        return {
          ...field,
          options: productList?.map((product) => ({itemName: product.itemName, stock: product.stock})),
        };
      } else if (field.name === "vendorName") {
        return {
          ...field,
          options: vendersList?.map((vendor) => vendor?.name),
        };
      }
      return field;
    });

    return {
      ...billingField,
      billingFormFields: updatedFields,
    };
  });

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "AwesomeFileName",
  });

  const handleAddNew = (sector) => {
    setAddNewCustomer({ show: true, option: sector });
  };
  const closeNewCustomer = () => {
    setAddNewCustomer({ show: false });
  };
  const editOrder = (orderID) => {
    setIsEditMode(true);
    if (orders.length > 0 && orderID) {
      const editOrderRecord = orders.find((item) => item.id === Number(orderID));
      localStorage.setItem('formData', JSON.stringify(editOrderRecord.order))
      setFormData(editOrderRecord)
      setBillDate(dayjs(editOrderRecord?.billingDate))
      setAddData(editOrderRecord?.order)
    }    
  };
  
  useEffect(() => {
    const orderID = orderParams?.search.replace("?order/", "");
    if(orderID) {
      editOrder(orderID);
    }
  }, [orders])

  
  const handleUpdate = async () => {
    const orderID = orderParams?.search.replace("?order/", "");
    const updateRecord = {...formData, order: addData}
    try {
      const response = await apiResponse(`/orders/${orderID}`, 'PATCH', null, {
        ...updateRecord,
        invoiceNo: updateRecord.invoiceNo,
        id: Date.now(),
      })
        if(response) {
          toast.success("Updated order successfully")
          localStorage.clear();
          setIsEditMode(false);
          navigate('/orders')
        }
    } catch {
      toast.error("Something went wrong");
    }
  }

  return {
    mappedBillingFields,
    handleSave,
    handleAddData,
    handleCancel,
    addData,
    setAddData,
    orderIndex,
    formData,
    formError,
    billDate,
    handleChange,
    handleAddNew,
    addNewCustomer,
    closeNewCustomer,
    handlePrint,
    componentRef,
    isEditMode,
    handleUpdate,
    handleClearAll
  };
};

export default DashboardContainer;
