import { CircularProgress } from "@mui/material";

import EditProductContainer from "../../container/editProduct.container";
import { productFields } from "../../description/productFields.description";
import IMSButton from "../../shared/IMSButton";
import IMSForm from "../../shared/IMSForm";
import IMSFormFields from "../../shared/IMSFormFields";
import IMSStack from "../../shared/IMSStack";

const EditProduct = ({ editData, onSaved }) => {
  const { handleChange, handleAddProduct, formData, error, saving, t } =
    EditProductContainer({ editData, onSaved });

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
          {t("buttonText.updateProduct")}
          {saving && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </IMSButton>
      </IMSStack>
    </IMSForm>
  );
};

export default EditProduct;
