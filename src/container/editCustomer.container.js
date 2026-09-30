import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { apiResponse } from "../api";
import { customerFields } from "../description/customerFields.description";
import { customerSaved, selectCustomers } from "../store/slice/customerSlice";
import validation from "../utils/validation";

const EditCustomerContainer = ({ editData, onSaved } = {}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const customers = useSelector(selectCustomers);
  const [error, setError] = useState({});
  const [formData, setFormData] = useState(editData || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(editData || {});
    setError({});
  }, [editData]);

  const handleChange = (event, pattern, sName, val, label) => {
    const name = event?.target?.name || sName;
    const value = event?.target ? event.target.value : val;
    setError((prev) => ({
      ...prev,
      [name]: validation(pattern, value, label, t),
    }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditCustomer = async (event) => {
    event.preventDefault();

    const nextError = {};
    customerFields.forEach((field) => {
      if (!field.pattern) return;
      nextError[field.name] = validation(
        field.pattern,
        formData[field.name],
        field.label,
        t
      );
    });

    const phone = formData.phone?.trim();
    if (!nextError.phone && phone) {
      const duplicate = customers.some(
        (customer) =>
          customer.id !== editData?.id && customer.phone?.trim() === phone
      );
      if (duplicate) nextError.phone = t("errorMsg.duplicatePhone");
    }

    setError(nextError);
    if (!Object.values(nextError).every((message) => !message)) return;

    // As with products, the id must survive an edit.
    const payload = {
      name: formData.name?.trim(),
      phone,
      address: formData.address?.trim() || "",
    };

    setSaving(true);
    try {
      const response = await apiResponse(
        `/venders/${editData.id}`,
        "PATCH",
        null,
        payload
      );
      if (!response.success) throw new Error("update failed");
      dispatch(customerSaved({ ...editData, ...payload }));
      toast.success(t("toast.customerUpdated", { name: payload.name }));
      onSaved?.();
    } catch {
      toast.error(t("toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return { handleChange, handleEditCustomer, error, formData, saving, t };
};

export default EditCustomerContainer;
