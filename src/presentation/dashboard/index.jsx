import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

import DashboardContainer from "../../container/dashboard.container";
import IMSAutoComplete from "../../shared/IMSAutoComplete";
import IMSButton from "../../shared/IMSButton";
import IMSDatePicker from "../../shared/IMSDatePicker";
import IMSDialog from "../../shared/IMSDialog";
import IMSForm from "../../shared/IMSForm";
import IMSGrid from "../../shared/IMSGrid";
import IMSListItem from "../../shared/IMSListItem";
import IMSRadioGroup from "../../shared/IMSRadioGroup";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";
import IMSTextField from "../../shared/IMSTextField";
import IMSTypography from "../../shared/IMSTypography";
import AddCustomer from "./addCustomer";
import AddProduct from "./addProduct";
import { Print } from "./print";
import ProductTable from "./productTable";

const hideOnPrint = { "@media print": { display: "none" } };

const Dashboard = () => {
  const {
    mappedBillingFields,
    getFieldValue,
    handleSave,
    handleAddData,
    handleCancel,
    addData,
    setAddData,
    formData,
    formError,
    billDate,
    handleChange,
    handleAddNew,
    addNewCustomer,
    closeNewCustomer,
    isEditMode,
    handleUpdate,
    handleClearAll,
    loading,
    receiptData,
    settings,
  } = DashboardContainer();

  const { t } = useTranslation();
  const { generateReceipt } = Print();

  const isDisabled = (field) =>
    typeof field.disabled === "function"
      ? field.disabled(formData)
      : Boolean(field.disabled);

  const labelFor = (field) =>
    field.name === "GST"
      ? `${t(field.label)} (${settings.gstRate}%)`
      : t(field.label);

  return (
    <>
      <ProductTable
        billingData={addData}
        setAddData={setAddData}
        sx={{
          minHeight: 400,
          maxHeight: 400,
          marginBottom: "auto",
          ...hideOnPrint,
        }}
      />
      <IMSStack position="relative" sx={{ mt: 3, ...hideOnPrint }}>
        <IMSForm onSubmit={handleAddData}>
          <IMSGrid container columnSpacing={2}>
            {mappedBillingFields.map((billingField, groupIndex) => (
              <IMSGrid
                item
                md={billingField?.md}
                sx={billingField?.sx}
                key={groupIndex}
              >
                <IMSGrid container columnSpacing={2} alignItems="flex-end">
                  {billingField.billingFormFields.map((field) => {
                    const index = 0;
                    const disabled = isDisabled(field);
                    const error = disabled ? undefined : formError[field.name];
                    const fieldProps = {
                      formLabel: labelFor(field),
                      name: field.name,
                      value: getFieldValue(field, index),
                      onChange: (event, selectedOption) =>
                        handleChange(event, selectedOption, field, index),
                      multiline: field.multiline,
                      rows: field.rows,
                      addNew: field.addNew,
                      addClick: () => handleAddNew(field.sector),
                      error: Boolean(error),
                      helperText: error,
                      gutterNone: field.gutterNone,
                      row: field.row,
                    };

                    switch (field.type) {
                      case "autoComplete":
                        return (
                          <IMSGrid item md={field?.md} key={field.name}>
                            <IMSAutoComplete
                              {...fieldProps}
                              options={field?.options || []}
                              autoHighlight
                              blurOnSelect
                              selectOnFocus
                              freeSolo
                              isOptionEqualToValue={(option, selected) =>
                                (option?.itemName ?? option?.vendorName ?? option) ===
                                (selected?.itemName ?? selected?.vendorName ?? selected)
                              }
                              getOptionLabel={(option) =>
                                field?.name === "itemName"
                                  ? option?.itemName ?? option ?? ""
                                  : option?.vendorName ?? option ?? ""
                              }
                              renderOption={(props, option) => {
                                const { key, ...optionProps } = props;
                                const outOfStock =
                                  field?.name === "itemName" &&
                                  Number(option?.stock) <= 0;
                                return (
                                  <IMSListItem
                                    key={key}
                                    direction="row"
                                    {...optionProps}
                                    sx={{
                                      pointerEvents: outOfStock ? "none" : "auto",
                                      opacity: outOfStock ? 0.5 : 1,
                                    }}
                                  >
                                    {field?.name === "itemName" ? (
                                      <>
                                        {option?.itemName}
                                        <IMSTypography
                                          ml="auto"
                                          variant="body2"
                                          color={outOfStock ? "error" : "gray"}
                                        >
                                          {outOfStock
                                            ? t("description.outOfStock")
                                            : `${option?.stock} ${option?.quantityCategory}`}
                                        </IMSTypography>
                                      </>
                                    ) : (
                                      option?.vendorName
                                    )}
                                  </IMSListItem>
                                );
                              }}
                            />
                          </IMSGrid>
                        );
                      case "text":
                      case "number":
                        return (
                          <IMSGrid item md={field.md} key={field.name}>
                            <IMSTextField
                              {...fieldProps}
                              type={field?.type}
                              InputProps={{
                                readOnly: disabled,
                                disabled,
                              }}
                              inputProps={field.inputProps}
                            />
                          </IMSGrid>
                        );
                      case "radio":
                        return (
                          <IMSGrid item md={field.md} key={field.name}>
                            <IMSRadioGroup
                              {...fieldProps}
                              value={getFieldValue(field, index) || field.defaultValue}
                              list={field.list}
                            />
                          </IMSGrid>
                        );
                      case "select":
                        return (
                          <IMSGrid item md={field.md} key={field.name}>
                            <IMSSelect
                              {...fieldProps}
                              value={
                                getFieldValue(field, index) || field.defaultValue || ""
                              }
                              menu={field.menu}
                              disabled={disabled}
                              aria-label={field.ariaLabel && t(field.ariaLabel)}
                              data-testid={`${field.name}-select`}
                            />
                          </IMSGrid>
                        );
                      case "datePicker":
                        return (
                          <IMSGrid item md={field.md} key={field.name}>
                            <IMSDatePicker
                              {...fieldProps}
                              value={billDate}
                              maxDate={undefined}
                            />
                          </IMSGrid>
                        );
                      default:
                        return null;
                    }
                  })}
                </IMSGrid>
              </IMSGrid>
            ))}
            <IMSStack
              direction="row"
              spacing={1}
              position="absolute"
              right={0}
              bottom={0}
            >
              <IMSButton variant="contained" type="submit">
                {t("buttonText.addNew")}
              </IMSButton>
              {isEditMode ? (
                <>
                  <IMSButton
                    variant="contained"
                    disabled={loading}
                    onClick={handleUpdate}
                  >
                    {t("buttonText.update")}
                    {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </IMSButton>
                  <IMSButton variant="contained" onClick={handleClearAll}>
                    {t("buttonText.clearAll")}
                  </IMSButton>
                </>
              ) : (
                <>
                  <IMSButton
                    disabled={loading}
                    variant="contained"
                    onClick={handleSave}
                  >
                    {t("buttonText.save")}
                    {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </IMSButton>
                  <IMSButton variant="contained" onClick={handleCancel}>
                    {t("buttonText.cancel")}
                  </IMSButton>
                </>
              )}
              <IMSButton
                variant="contained"
                disabled={addData?.length === 0}
                onClick={() => generateReceipt(receiptData)}
              >
                {t("buttonText.print")}
              </IMSButton>
            </IMSStack>
          </IMSGrid>
        </IMSForm>
      </IMSStack>
      {addNewCustomer.option === "customerInfo" && (
        <IMSDialog
          title={t("formLabel.addNewCustomer")}
          open={addNewCustomer.show}
          maxWidth="sm"
          handleClose={closeNewCustomer}
        >
          <AddCustomer onSaved={closeNewCustomer} />
        </IMSDialog>
      )}
      {addNewCustomer.option === "order" && (
        <IMSDialog
          title={t("formLabel.addNewProduct")}
          open={addNewCustomer.show}
          maxWidth="sm"
          handleClose={closeNewCustomer}
        >
          <AddProduct onSaved={closeNewCustomer} />
        </IMSDialog>
      )}
    </>
  );
};

export default Dashboard;
