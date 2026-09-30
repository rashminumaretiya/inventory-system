import { Card, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DashboardContainer from "../../container/dashboard.container";
import IMSAutoComplete from "../../shared/IMSAutoComplete";
import IMSBox from "../../shared/IMSBox";
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
import { BOTTOM_NAV_HEIGHT } from "../../shared/theme";
import { formatMoney } from "../../utils/billing";
import AddCustomer from "./addCustomer";
import AddProduct from "./addProduct";
import { Print } from "./print";
import ProductTable from "./productTable";

const hideOnPrint = { "@media print": { display: "none" } };

/** Chrome above and below the page content, so the till fits exactly. */
const MOBILE_CHROME = 56 + 16 + BOTTOM_NAV_HEIGHT + 16;
const DESKTOP_CHROME = 64;

/** Tighter vertical rhythm than the default form spacing. */
const compactForm = { "& .MuiFormControl-root": { mb: 1.25 } };

const Dashboard = () => {
  const {
    mappedBillingFields,
    getFieldValue,
    handleSave,
    handleAddData,
    handleCancel,
    addData,
    setAddData,
    stepLine,
    removeLine,
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
    totals,
  } = DashboardContainer();

  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { generateReceipt } = Print();
  const [detailsOpen, setDetailsOpen] = useState(false);

  /** Flat field list, plus the phone's entry / details / totals split. */
  const { groups, byPane } = useMemo(() => {
    const flat = mappedBillingFields.flatMap((g) => g.billingFormFields);
    return {
      groups: mappedBillingFields,
      byPane: {
        entry: flat.filter((f) => f.pane === "entry"),
        details: flat.filter((f) => f.pane === "details"),
        totals: flat.filter((f) => f.pane === "totals"),
      },
    };
  }, [mappedBillingFields]);

  const isDisabled = (field) =>
    typeof field.disabled === "function"
      ? field.disabled(formData)
      : Boolean(field.disabled);

  const labelFor = (field) =>
    field.name === "GST"
      ? `${t(field.label)} (${settings.gstRate}%)`
      : t(field.label);

  const renderField = (field) => {
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
      // Side-by-side label and value only where there is room for it.
      row: field.row && !isMobile,
    };

    switch (field.type) {
      case "autoComplete":
        return (
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
                ? (option?.itemName ?? option ?? "")
                : (option?.vendorName ?? option ?? "")
            }
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              const outOfStock =
                field?.name === "itemName" && Number(option?.stock) <= 0;
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
        );
      case "text":
      case "number":
        return (
          <IMSTextField
            {...fieldProps}
            type={field?.type}
            InputProps={{ readOnly: disabled, disabled }}
            inputProps={field.inputProps}
            sx={
              field.emphasis
                ? {
                    "& .MuiInputBase-input": {
                      fontSize: 20,
                      fontWeight: 700,
                      textAlign: "right",
                    },
                  }
                : undefined
            }
          />
        );
      case "radio":
        return (
          <IMSRadioGroup
            {...fieldProps}
            value={getFieldValue(field, index) || field.defaultValue}
            list={field.list}
          />
        );
      case "select":
        return (
          <IMSSelect
            {...fieldProps}
            value={getFieldValue(field, index) || field.defaultValue || ""}
            menu={field.menu}
            disabled={disabled}
            aria-label={field.ariaLabel && t(field.ariaLabel)}
            data-testid={`${field.name}-select`}
          />
        );
      case "datePicker":
        return <IMSDatePicker {...fieldProps} value={billDate} />;
      default:
        return null;
    }
  };

  const fieldGrid = (fields, columnSpacing = 2) => (
    <IMSGrid container columnSpacing={columnSpacing} alignItems="flex-end">
      {fields.map((field) => (
        <IMSGrid item xs={field?.xs ?? 12} md={field?.md} key={field.name}>
          {renderField(field)}
        </IMSGrid>
      ))}
    </IMSGrid>
  );

  const cart = (
    <Card
      sx={{
        flex: 1,
        minHeight: { xs: 0, md: 120 },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        mb: { xs: 1.5, md: 2 },
      }}
    >
      <ProductTable
        billingData={addData}
        setAddData={setAddData}
        onStepLine={stepLine}
        onRemoveLine={removeLine}
        hideTotal={isMobile}
        sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}
      />
    </Card>
  );

  const primaryAction = isEditMode ? (
    <IMSButton
      variant="contained"
      disabled={loading}
      onClick={handleUpdate}
      fullWidth={isMobile}
    >
      {t("buttonText.update")}
      {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
    </IMSButton>
  ) : (
    <IMSButton
      disabled={loading}
      variant="contained"
      onClick={handleSave}
      fullWidth={isMobile}
    >
      {t("buttonText.save")}
      {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
    </IMSButton>
  );

  /* ----------------------------------------------------------- phone view */
  if (isMobile) {
    return (
      <>
        <IMSBox
          sx={{
            display: "flex",
            flexDirection: "column",
            // Exactly one screen: nothing scrolls except the cart.
            height: `calc(100vh - ${MOBILE_CHROME}px)`,
            "@supports (height: 100dvh)": {
              height: `calc(100dvh - ${MOBILE_CHROME}px)`,
            },
            ...hideOnPrint,
          }}
        >
          <IMSForm onSubmit={handleAddData}>
            <Card sx={{ p: 1.5, mb: 1.5, ...compactForm }}>
              {fieldGrid(byPane.entry, 1.5)}
              <IMSButton variant="contained" type="submit" fullWidth>
                {t("buttonText.addNew")}
              </IMSButton>
            </Card>
          </IMSForm>

          {cart}

          <IMSBox sx={{ flexShrink: 0 }}>
            <IMSStack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                mb: 1,
                px: 1.75,
                py: 1.25,
                borderRadius: 2,
                bgcolor: "primary.light",
                border: 1,
                borderColor: "primary.main",
              }}
            >
              <IMSStack>
                <IMSTypography variant="caption" color="primary.dark">
                  {t("description.itemsCount", { count: addData.length })}
                </IMSTypography>
                <IMSTypography color="primary.dark" fontWeight={600}>
                  {t("formLabel.totalPrice")}
                </IMSTypography>
              </IMSStack>
              <IMSTypography variant="h4" color="primary.dark">
                {settings.currencySymbol}
                {formatMoney(totals.total)}
              </IMSTypography>
            </IMSStack>
            <IMSGrid container spacing={1}>
              <IMSGrid item xs={6}>
                <IMSButton
                  variant="outlined"
                  color="black"
                  fullWidth
                  startIcon={<TuneIcon />}
                  onClick={() => setDetailsOpen(true)}
                >
                  {t("description.billDetails")}
                </IMSButton>
              </IMSGrid>
              <IMSGrid item xs={6}>
                {primaryAction}
              </IMSGrid>
              <IMSGrid item xs={6}>
                <IMSButton
                  variant="outlined"
                  color="black"
                  fullWidth
                  onClick={isEditMode ? handleClearAll : handleCancel}
                >
                  {t(isEditMode ? "buttonText.clearAll" : "buttonText.cancel")}
                </IMSButton>
              </IMSGrid>
              <IMSGrid item xs={6}>
                <IMSButton
                  variant="outlined"
                  fullWidth
                  disabled={addData?.length === 0}
                  onClick={() => generateReceipt(receiptData)}
                >
                  {t("buttonText.print")}
                </IMSButton>
              </IMSGrid>
            </IMSGrid>
          </IMSBox>
        </IMSBox>

        {/* Customer and payment sit behind a sheet: needed on some bills, not
            on most, and keeping them here is what lets the till fit a screen. */}
        <IMSDialog
          title={t("description.billDetails")}
          open={detailsOpen}
          handleClose={() => setDetailsOpen(false)}
          maxWidth="sm"
        >
          <IMSBox sx={compactForm}>
            {fieldGrid(byPane.details)}
            <IMSBox sx={{ mt: 1 }}>{fieldGrid(byPane.totals)}</IMSBox>
          </IMSBox>
          <IMSButton
            variant="contained"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => setDetailsOpen(false)}
          >
            {t("buttonText.done")}
          </IMSButton>
        </IMSDialog>

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
  }

  /* --------------------------------------------------------- desktop view */
  return (
    <>
      <IMSBox
        sx={{
          display: "flex",
          flexDirection: "column",
          height: `calc(100vh - ${DESKTOP_CHROME}px)`,
          "@supports (height: 100dvh)": {
            height: `calc(100dvh - ${DESKTOP_CHROME}px)`,
          },
          ...hideOnPrint,
        }}
      >
        {cart}

        {/* On a short screen this pane scrolls inside itself rather than
            pushing the page, so the till always fits exactly one viewport. */}
        <IMSBox
          sx={{
            flexShrink: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <IMSForm onSubmit={handleAddData}>
            <IMSGrid container spacing={2} sx={{ ...compactForm }}>
              {groups.map((group) => (
                <IMSGrid item xs={12} md={group?.md} key={group.key}>
                  <Card
                    sx={{
                      p: 1.75,
                      height: "100%",
                      ...(group.accent && {
                        bgcolor: "primary.light",
                        borderColor: "primary.main",
                        "& .MuiOutlinedInput-root": { bgcolor: "white.main" },
                      }),
                    }}
                  >
                    {fieldGrid(group.billingFormFields)}
                  </Card>
                </IMSGrid>
              ))}
            </IMSGrid>

            <IMSStack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              sx={{ pt: 2, flexShrink: 0 }}
            >
              <IMSButton variant="contained" type="submit">
                {t("buttonText.addNew")}
              </IMSButton>
              {primaryAction}
              <IMSButton
                variant="outlined"
                color="black"
                onClick={isEditMode ? handleClearAll : handleCancel}
              >
                {t(isEditMode ? "buttonText.clearAll" : "buttonText.cancel")}
              </IMSButton>
              <IMSButton
                variant="outlined"
                disabled={addData?.length === 0}
                onClick={() => generateReceipt(receiptData)}
              >
                {t("buttonText.print")}
              </IMSButton>
            </IMSStack>
          </IMSForm>
        </IMSBox>
      </IMSBox>

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
