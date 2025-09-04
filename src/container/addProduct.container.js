import { useEffect, useState } from "react";
import validation from "../utils/validation";
import toast from "react-hot-toast";
import { ApiContainer } from "../api";
import { productFields } from "../description/productFields.description";
import { useDispatch, useSelector } from "react-redux";
import { productData } from "../store/slice/productSlice";
import { useTranslation } from "react-i18next";

const AddProductContainer = () => {
  const { t } = useTranslation();
  const [error, setError] = useState({});
  const [formData, setFormData] = useState({});
  const { apiResponse } = ApiContainer();
  const dispatch = useDispatch();
  const allProduct = useSelector((state) => state?.product?.product || []);

  const handleChange = (e, pattern, sName, val, label) => {
    const { name, value } = e.target;
    const selectedName = name || sName;
    const selectedValue = value || val;
    setError((prev) => ({
      ...prev,
      [selectedName]: validation(pattern, selectedValue, label, t),
    }));
    setFormData((prev) => ({ ...prev, [selectedName]: selectedValue }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    let newErr = {};
    productFields.forEach((field) => {
      newErr[field.name] = validation(
        field.pattern,
        formData[field.name],
        field.label,
        t
      );
    });
    formData.stock =
      formData.quantityCategory === "Grams"
        ? (formData?.stock / 1000).toFixed(3)
        : formData?.stock;

    setError((prev) => ({
      ...prev,
      ...newErr,
    }));

    if (!newErr.name) {
      const isDuplicate = allProduct.some(
        (prod) =>
          prod.itemName?.trim().toLowerCase() ===
          formData.itemName?.trim().toLowerCase()
      );
      if (isDuplicate) {
        setError((prev) => ({
          ...prev,
          itemName: "Duplicate product found please enter different product",
        }));
        return;
      }
    }

    if (Object.values(newErr).every((el) => el === undefined || el === "")) {
      try {
        const response = await apiResponse("/product", "POST", null, {
          ...formData,
          id: Date.now(),
        });
        if (response) {
          toast.success("Added");
          const newProduct = [...allProduct, response?.data];
          dispatch(productData({ payload: newProduct }));
          setFormData({});
        }
      } catch {
        toast.error("Something went wrong");
      }
    }
  };
  useEffect(() => {
    setFormData((prev) => ({ ...prev, quantityCategory: "Kg" }));
  }, []);
  return { handleChange, handleAddProduct, error, formData, t };
};

export default AddProductContainer;
