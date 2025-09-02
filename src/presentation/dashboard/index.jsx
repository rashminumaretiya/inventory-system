import { CircularProgress } from "@mui/material";
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
import ProductTable from "./productTable";
import { Print } from "./print";

const Dashboard = () => {
  const {
    mappedBillingFields,
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
  } = DashboardContainer();

  const { generateReceipt } = Print();

  return (
    <>
      <ProductTable
        billingData={addData}
        setAddData={setAddData}
        sx={{
          minHeight: 400,
          maxHeight: 400,
          marginBottom: "auto",
          "@media print": {
            display: "none",
          },
        }}
      />
      <IMSStack
        position="relative"
        sx={{
          mt: 3,
          "@media print": {
            display: "none",
          },
        }}
      >
        <IMSForm key={formData?.GST} onSubmit={handleAddData}>
          <IMSGrid container columnSpacing={3}>
            {mappedBillingFields.map((billingField, index) => {
              return (
                <>
                  <IMSGrid
                    item
                    md={billingField?.md}
                    sx={billingField?.sx}
                    key={index}
                  >
                    <IMSGrid container columnSpacing={3} alignItems="flex-end">
                      {billingField.billingFormFields.map((field, i) => {
                        const index = 0;
                        const fieldProps = {
                          key: index,
                          formLabel: field.label,
                          name: field.name,
                          value:
                            field?.name === "itemName"
                              ? formData[field.sector]?.[index]?.[field.name]
                              : formData[field.name] ||
                                formData[field.sector]?.[field.name] ||
                                formData[field.sector]?.[index]?.[field.name] ||
                                "",
                          onChange: (e, val) =>
                            handleChange(
                              e,
                              field.pattern,
                              field.name,
                              val,
                              field.label,
                              index
                            ),
                          defaultValue:
                            formData[field.name] === undefined
                              ? field.defaultValue
                              : formData[field.name],
                          multiline: field.multiline,
                          rows: field.rows,
                          addNew: field.addNew,
                          addClick: () => handleAddNew(field.sector),
                          error: formError[field.name],
                          gutterNone: field.gutterNone,
                          helperText:
                            !(
                              typeof field.disabled === "function" &&
                              field.disabled(formData)
                            ) && formError[field.name],
                        };
                        switch (field.type) {
                          case "autoComplete":
                            return (
                              <IMSGrid item md={field?.md} key={i}>
                                <IMSAutoComplete
                                  {...fieldProps}
                                  options={field?.options}
                                  getOptionLabel={(option) => {
                                    return field?.name === "itemName"
                                      ? option?.itemName || option
                                      : option;
                                  }}
                                  renderOption={(props, option) => {
                                    const { key, ...optionProps } = props;
                                    return (
                                      <IMSListItem
                                        key={key}
                                        direction="row"
                                        {...optionProps}
                                        disabled={Number(option?.stock) === 0}
                                        sx={{
                                          pointerEvents:
                                            Number(option?.stock) === 0 &&
                                            "none",
                                        }}
                                      >
                                        {field?.name === "itemName" ? (
                                          <>
                                            {option?.itemName}
                                            <IMSTypography
                                              ml="auto"
                                              variant="body2"
                                              color="gray"
                                            >
                                              {option?.stock}{" "}
                                              {option?.quantityCategory}
                                            </IMSTypography>
                                          </>
                                        ) : (
                                          option
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
                              <IMSGrid item md={field.md} key={i}>
                                <IMSTextField
                                  {...fieldProps}
                                  type={field?.type}
                                  InputProps={{
                                    readOnly: field?.disabled,
                                    disabled:
                                      typeof field.disabled === "function"
                                        ? field.disabled(formData)
                                        : field.disabled,
                                  }}
                                />
                              </IMSGrid>
                            );
                          case "radio":
                            return (
                              <IMSGrid item md={field.md} key={i}>
                                <IMSRadioGroup
                                  {...fieldProps}
                                  list={field.list}
                                />
                              </IMSGrid>
                            );
                          case "select":
                            return (
                              <IMSGrid item md={field.md} key={i}>
                                <IMSSelect {...fieldProps} menu={field.menu} />
                              </IMSGrid>
                            );
                          case "datePicker":
                            return (
                              <IMSGrid item md={field.md} key={i}>
                                <IMSDatePicker
                                  {...fieldProps}
                                  value={billDate}
                                />
                              </IMSGrid>
                            );
                          default:
                            return null;
                        }
                      })}
                    </IMSGrid>
                  </IMSGrid>
                </>
              );
            })}
            <IMSStack
              direction="row"
              spacing={1}
              position="absolute"
              right={0}
              bottom={0}
            >
              <IMSButton variant="contained" type="submit">
                Add New
              </IMSButton>
              {isEditMode ? (
                <>
                  <IMSButton variant="contained" onClick={handleUpdate}>
                    Update
                  </IMSButton>
                  <IMSButton variant="contained" onClick={handleClearAll}>
                    Clear All
                  </IMSButton>
                </>
              ) : (
                <>
                  <IMSButton
                    disabled={loading}
                    variant="contained"
                    onClick={handleSave}
                  >
                    Save{" "}
                    {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </IMSButton>
                  <IMSButton variant="contained" onClick={handleCancel}>
                    Cancel
                  </IMSButton>
                </>
              )}
              <IMSButton
                variant="contained"
                disabled={addData?.length === 0}
                onClick={() => generateReceipt(addData, formData)}
              >
                print
              </IMSButton>
            </IMSStack>
          </IMSGrid>
        </IMSForm>
      </IMSStack>
      {addNewCustomer.option === "customerInfo" && (
        <IMSDialog
          title={"Add New Customer"}
          open={addNewCustomer.show}
          maxWidth="sm"
          handleClose={closeNewCustomer}
        >
          <AddCustomer />
        </IMSDialog>
      )}
      {addNewCustomer.option === "order" && (
        <IMSDialog
          title={"Add New Product"}
          open={addNewCustomer.show}
          maxWidth="sm"
          handleClose={closeNewCustomer}
        >
          <AddProduct />
        </IMSDialog>
      )}
    </>
  );
};

export default Dashboard;
