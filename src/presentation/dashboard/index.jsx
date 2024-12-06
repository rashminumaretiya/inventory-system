import React from "react";
import DashboardContainer from "../../container/dashboard.container";
import IMSAutoComplete from "../../shared/IMSAutoComplete";
import IMSButton from "../../shared/IMSButton";
import IMSDatePicker from "../../shared/IMSDatePicker";
import IMSDialog from "../../shared/IMSDialog";
import IMSForm from "../../shared/IMSForm";
import IMSGrid from "../../shared/IMSGrid";
import IMSRadioGroup from "../../shared/IMSRadioGroup";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";
import IMSTextField from "../../shared/IMSTextField";
import AddCustomer from "./addCustomer";
import PrintOrder from "./printOrder";
import ProductTable from "./productTable";
import AddProduct from "./addProduct";

const Dashboard = () => {
  const {
    mappedBillingFields,
    handleSave,
    handleAddData,
    handleCancel,
    addData,
    setAddData,
    orderIndex,
    formData,
    formError,
    billDate,
    handleChange,
    handleAddNew,
    addNewCustomer,
    closeNewCustomer,
    handleAddCustomer,
    handlePrint,
    componentRef,
  } = DashboardContainer();

  return (
    <>
      <PrintOrder
        ref={componentRef}
        data={addData}
        formData={formData}
        billDate={billDate}
      />

      <ProductTable
        billingData={addData}
        setAddData={setAddData}
        sx={{
          minHeight: 330,
          maxHeight: 330,
          marginBottom: 4,
          "@media print": {
            display: "none",
          },
        }}
      />
      <IMSStack
        position="relative"
        sx={{
          "@media print": {
            display: "none",
          },
        }}
      >
        <IMSForm onSubmit={handleAddData}>
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
                        const index = orderIndex;
                        const fieldProps = {
                          key: index,
                          formLabel: field.label,
                          name: field.name,
                          value:
                            formData[field.name] ||
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
                          defaultValue: field.defaultValue,
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
              <IMSButton variant="contained" onClick={handleSave}>
                Save
              </IMSButton>
              <IMSButton variant="contained" onClick={handleCancel}>
                Cancel
              </IMSButton>
              <IMSButton variant="contained" onClick={handlePrint}>
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
