import React from "react";
import { CircularProgress } from "@mui/material";

import AddCustomerContainer from "../../container/addCustomer.container";
import { customerFields } from "../../description/customerFields.description";
import IMSButton from "../../shared/IMSButton";
import IMSForm from "../../shared/IMSForm";
import IMSFormFields from "../../shared/IMSFormFields";
import IMSStack from "../../shared/IMSStack";

const AddCustomer = ({ onSaved }) => {
  const { handleChange, handleAddCustomer, error, formData, saving, t } =
    AddCustomerContainer({ onSaved });

  return (
    <IMSForm onSubmit={handleAddCustomer}>
      <IMSFormFields
        onChange={handleChange}
        error={error}
        fields={customerFields}
        value={formData}
      />
      <IMSStack direction="row" justifyContent="flex-end" spacing={1}>
        <IMSButton variant="contained" type="submit" disabled={saving}>
          {t("buttonText.addCustomer")}
          {saving && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </IMSButton>
      </IMSStack>
    </IMSForm>
  );
};

export default AddCustomer;
