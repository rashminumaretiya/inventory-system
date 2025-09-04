import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import validation from "../utils/validation";
import { ApiContainer } from "../api";
import { productData } from "../store/slice/productSlice";
import toast from "react-hot-toast";
import { productFields } from "../description/productFields.description";
import { useTranslation } from "react-i18next";

const EditProductContainer = ({ editData }) => {
  const { t } = useTranslation();
  const [error, setError] = useState({});
  const [formData, setFormData] = useState(editData);
  const { apiResponse } = ApiContainer();
  const dispatch = useDispatch();

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
    setError((prev) => ({
      ...prev,
      ...newErr,
    }));
    if (Object.values(newErr).every((el) => el === undefined || el === "")) {
      try {
        const response = await apiResponse(
          `/product/${editData.id}`,
          "PATCH",
          null,
          {
            ...formData,
            id: Date.now(),
          }
        );
        if (response) {
          toast.success("Updated product successfully");
          dispatch(productData({ payload: [response?.data] }));
          setFormData({});
        }
      } catch {
        toast.error("Something went wrong");
      }
    }
  };
  useEffect(() => {
    setFormData((prev) => editData);
  }, [editData]);
  return {
    handleChange,
    handleAddProduct,
    error,
    formData,
    t,
  };
};

export default EditProductContainer;
