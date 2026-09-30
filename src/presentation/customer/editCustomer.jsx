import React from "react";
import { CircularProgress } from "@mui/material";

import EditCustomerContainer from "../../container/editCustomer.container";
import { customerFields } from "../../description/customerFields.description";
import IMSButton from "../../shared/IMSButton";
import IMSForm from "../../shared/IMSForm";
import IMSFormFields from "../../shared/IMSFormFields";
import IMSStack from "../../shared/IMSStack";

const EditCustomer = ({ editData, onSaved }) => {
  const { handleChange, handleEditCustomer, formData, error, saving, t } =
    EditCustomerContainer({ editData, onSaved });

  return (
    <IMSForm onSubmit={handleEditCustomer}>
      <IMSFormFields
        onChange={handleChange}
        error={error}
        fields={customerFields}
        value={formData}
      />
      <IMSStack direction="row" justifyContent="flex-end" spacing={1}>
        <IMSButton variant="contained" type="submit" disabled={saving}>
          {t("buttonText.updateCustomer")}
          {saving && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </IMSButton>
      </IMSStack>
    </IMSForm>
  );
};

export default EditCustomer;
