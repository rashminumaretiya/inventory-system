import { useState } from "react";
import validation from "../utils/validation";
import { customerFields } from "../description/customerFields.description";
import toast from "react-hot-toast";
import { ApiContainer } from "../api";
import { useDispatch } from "react-redux";
import { userData } from "../store/slice/customerSlice";

const AddCustomerContainer = () => {
  const [error, setError] = useState({});
  const [formData, setFormData] = useState({});
  const dispatch = useDispatch()
  const { apiResponse } = ApiContainer();

  const handleChange = (e, pattern, sName, val, label) => {
    const { name, value } = e.target;
    const selectedName = name || sName;
    const selectedValue = value || val;
    setError((prev) => ({
      ...prev,
      [selectedName]: validation(pattern, selectedValue, label),
    }));
    setFormData((prev) => ({ ...prev, [selectedName]: selectedValue }));
  };
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    let newErr = {};
    customerFields.forEach((field) => {
      newErr[field.name] = validation(
        field.pattern,
        formData[field.name],
        field.label
      );
    });
    setError((prev) => ({
      ...prev,
      ...newErr,
    }));
    if (Object.values(newErr).every((el) => el === undefined)) {
      try {
        const response = await apiResponse("/venders", "POST", null, {
          ...formData,
          id: Date.now(),
        });
        if (response) {
          toast.success("Added");
          dispatch(userData({ payload: formData }))
          setFormData({});
        }
      } catch {
        toast.error("Something went wrong");
      }
    }
  };
  return { handleChange, handleAddCustomer, error, formData };
};

export default AddCustomerContainer;
