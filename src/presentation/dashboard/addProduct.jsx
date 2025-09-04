import React from "react";
import IMSForm from "../../shared/IMSForm";
import IMSFormFields from "../../shared/IMSFormFields";
import IMSStack from "../../shared/IMSStack";
import IMSButton from "../../shared/IMSButton";
import { productFields } from "../../description/productFields.description";
import AddProductContainer from "../../container/addProduct.container";

const AddProduct = () => {
  const { handleChange, handleAddProduct, error, formData, t } =
    AddProductContainer();
  return (
    <IMSForm onSubmit={handleAddProduct}>
      <IMSFormFields
        onChange={handleChange}
        error={error}
        helperText={error}
        fields={productFields}
        value={formData}
      />
      <IMSStack direction="row" justifyContent="flex-end" spacing={1}>
        <IMSButton variant="contained" type="submit">
          {t("buttonText.addProduct")}
        </IMSButton>
      </IMSStack>
    </IMSForm>
  );
};

export default AddProduct;
