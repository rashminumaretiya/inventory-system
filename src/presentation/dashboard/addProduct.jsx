import React from "react";
import { CircularProgress } from "@mui/material";

import AddProductContainer from "../../container/addProduct.container";
import { productFields } from "../../description/productFields.description";
import IMSButton from "../../shared/IMSButton";
import IMSForm from "../../shared/IMSForm";
import IMSFormFields from "../../shared/IMSFormFields";
import IMSStack from "../../shared/IMSStack";

const AddProduct = ({ onSaved }) => {
  const { handleChange, handleAddProduct, error, formData, saving, t } =
    AddProductContainer({ onSaved });

  return (
    <IMSForm onSubmit={handleAddProduct}>
      <IMSFormFields
        onChange={handleChange}
        error={error}
        fields={productFields}
        value={formData}
      />
      <IMSStack direction="row" justifyContent="flex-end" spacing={1}>
        <IMSButton variant="contained" type="submit" disabled={saving}>
          {t("buttonText.addProduct")}
          {saving && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </IMSButton>
      </IMSStack>
    </IMSForm>
  );
};

export default AddProduct;
