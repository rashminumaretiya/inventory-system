import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import validation from "../utils/validation";
import { ApiContainer } from "../api";
import toast from "react-hot-toast";
import { customerFields } from "../description/customerFields.description";
import { userData } from "../store/slice/customerSlice";
import { useTranslation } from "react-i18next";

const EditCustomerContainer = ({ editData }) => {
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

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    let newErr = {};
    customerFields.forEach((field) => {
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
          `/venders/${editData.id}`,
          "PATCH",
          null,
          {
            ...formData,
            id: Date.now(),
          }
        );
        if (response.success) {
          toast.success("Updated Customer successfully");
          dispatch(userData({ payload: response?.data }));
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
    handleEditCustomer,
    error,
    formData,
    t,
  };
};

export default EditCustomerContainer;
