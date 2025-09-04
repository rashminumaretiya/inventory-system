import React from "react";
import IMSForm from "../../shared/IMSForm";
import IMSFormFields from "../../shared/IMSFormFields";
import IMSStack from "../../shared/IMSStack";
import IMSButton from "../../shared/IMSButton";
import AddCustomerContainer from "../../container/addCustomer.container";
import { customerFields } from "../../description/customerFields.description";

const AddCustomer = () => {
  const { handleChange, handleAddCustomer, error, formData, t } =
    AddCustomerContainer();
  return (
    <IMSForm onSubmit={handleAddCustomer}>
      <IMSFormFields
        onChange={handleChange}
        error={error}
        helperText={error}
        fields={customerFields}
        value={formData}
      />
      <IMSStack direction="row" justifyContent="flex-end" spacing={1}>
        <IMSButton variant="contained" type="submit">
          {t("buttonText.addCustomer")}
        </IMSButton>
      </IMSStack>
    </IMSForm>
  );
};

export default AddCustomer;
