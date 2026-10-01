import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Card,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
import { BOTTOM_NAV_HEIGHT, surface } from "../../shared/theme";
import { formatMoney, num } from "../../utils/billing";
import AddCustomer from "./addCustomer";
import AddProduct from "./addProduct";
import { Print } from "./print";
import ProductTable from "./productTable";

const hideOnPrint = { "@media print": { display: "none" } };

/** Chrome above and below the page content, so the till fits exactly. */
const MOBILE_CHROME = 56 + 16 + BOTTOM_NAV_HEIGHT + 16;
const DESKTOP_CHROME = 64;

/** Width of the right-hand bill panel. */
const PANEL_WIDTH = { md: 330, lg: 360, xl: 420 };

/** Tighter vertical rhythm than the default form spacing. */

/** For single-row strips: fields sit flush so they line up with the button. */
const rowForm = { "& .MuiFormControl-root": { mb: 0 } };

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

  /** Fields by group key, e.g. `group.entry`. */
  const group = useMemo(
    () =>
      Object.fromEntries(
        mappedBillingFields.map((g) => [g.key, g.billingFormFields]),
      ),
    [mappedBillingFields],
  );
  const fieldNamed = (name) =>
    Object.values(group)
      .flat()
      .find((field) => field.name === name);

  const isDisabled = (field) =>
    typeof field.disabled === "function"
      ? field.disabled(formData)
      : Boolean(field.disabled);

  const labelFor = (field) =>
    field.name === "GST"
      ? `${t(field.label)} (${settings.gstRate}%)`
      : t(field.label);

  const renderField = (field) => {
    if (!field) return null;
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

  const fieldGrid = (fields = [], columnSpacing = 2) => (
    <IMSGrid container columnSpacing={columnSpacing} alignItems="flex-end">
      {fields.map((field) => (
        <IMSGrid item xs={field?.xs ?? 12} md={field?.md} key={field.name}>
          {renderField(field)}
        </IMSGrid>
      ))}
    </IMSGrid>
  );

  const currency = settings.currencySymbol;
  const changeDue = num(receiptData.changeDue);
  const balanceDue = num(receiptData.balanceDue);

  /* ---------------------------------------------------------- shared parts */

  const cart = (
    <Card
      sx={{
        flex: 1,
        minHeight: { xs: 0, md: 160 },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <ProductTable
        billingData={addData}
        setAddData={setAddData}
        onStepLine={stepLine}
        onRemoveLine={removeLine}
        hideTotal
        sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}
      />
    </Card>
  );

  /**
   * One row of the bill summary. The figure carries a test id so tests read
   * the number rather than depend on how it is styled.
   */
  const summaryRow = (id, label, value, { sign = "", tone } = {}) => (
    <IMSStack
      direction="row"
      justifyContent="space-between"
      alignItems="baseline"
      sx={{ py: 0.4 }}
    >
      <IMSTypography variant="body2" color="text.secondary">
        {label}
      </IMSTypography>
      <IMSTypography
        variant="body2"
        fontWeight={600}
        color={tone || "text.primary"}
      >
        {sign}
        <span data-testid={`summary-${id}`}>
          {currency}
          {formatMoney(value)}
        </span>
      </IMSTypography>
    </IMSStack>
  );

  /** Receipt-style totals: calculated, so shown as figures, not input boxes. */
  const summary = (
    <IMSBox
      sx={{
        bgcolor: "primary.light",
        border: 1,
        borderColor: "primary.main",
        borderRadius: 2.5,
        px: 2,
        py: 1.5,
      }}
    >
      {summaryRow("subtotal", t("formLabel.subtotal"), totals.subtotal)}
      {summaryRow(
        "discountAmount",
        t("formLabel.discountApplied"),
        totals.discountAmount,
        { sign: totals.discountAmount > 0 ? "− " : "" },
      )}
      {summaryRow(
        "GSTAmount",
        `${t("formLabel.GSTAmount")} (${
          formData.GST === "yes" ? settings.gstRate : 0
        }%)`,
        totals.gstAmount,
      )}

      <Divider sx={{ my: 1, borderColor: "primary.main", opacity: 0.25 }} />

      <IMSStack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <IMSStack>
          <IMSTypography fontWeight={700} color="primary.dark">
            {t("formLabel.totalPrice")}
          </IMSTypography>
          <IMSTypography variant="caption" color="primary.dark">
            {t("description.itemsCount", { count: addData.length })}
          </IMSTypography>
        </IMSStack>
        <IMSTypography
          sx={{ fontSize: { xs: 28, md: 30 }, fontWeight: 800, lineHeight: 1 }}
          color="primary.dark"
        >
          <span data-testid="summary-total">
            {currency}
            {formatMoney(totals.total)}
          </span>
        </IMSTypography>
      </IMSStack>

      <Divider sx={{ my: 1, borderColor: "primary.main", opacity: 0.25 }} />

      {summaryRow("changeDue", t("formLabel.changeDue"), changeDue, {
        tone: changeDue > 0 ? "success.main" : "text.secondary",
      })}
      {summaryRow("balanceDue", t("formLabel.balanceDue"), balanceDue, {
        tone: balanceDue > 0 ? "error.main" : "text.secondary",
      })}
    </IMSBox>
  );

  const saveButton = (
    <IMSButton
      variant="contained"
      size="large"
      fullWidth
      disabled={loading}
      onClick={isEditMode ? handleUpdate : handleSave}
      sx={{ minHeight: 52, fontSize: 16 }}
    >
      {t(isEditMode ? "buttonText.update" : "buttonText.save")}
      {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
    </IMSButton>
  );

  const secondaryActions = (
    <IMSStack direction="row" spacing={1}>
      <IMSButton
        variant="outlined"
        fullWidth
        startIcon={<PrintOutlinedIcon />}
        disabled={addData?.length === 0}
        onClick={() => generateReceipt(receiptData)}
      >
        {t("buttonText.print")}
      </IMSButton>
      <IMSButton
        variant="outlined"
        color="black"
        fullWidth
        onClick={isEditMode ? handleClearAll : handleCancel}
      >
        {t(isEditMode ? "buttonText.clearAll" : "buttonText.cancel")}
      </IMSButton>
    </IMSStack>
  );

  const dialogs = (
    <>
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

  /* ----------------------------------------------------------- phone view */
  if (isMobile) {
    return (
      <>
        <IMSBox
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            // Exactly one screen: nothing scrolls except the cart.
            height: `calc(100vh - ${MOBILE_CHROME}px)`,
            "@supports (height: 100dvh)": {
              height: `calc(100dvh - ${MOBILE_CHROME}px)`,
            },
            ...hideOnPrint,
          }}
        >
          <IMSForm onSubmit={handleAddData}>
            <Card sx={{ p: 1.5 }}>
              {fieldGrid(group.entry, 1.5)}
              <IMSButton
                variant="contained"
                type="submit"
                fullWidth
                startIcon={<AddShoppingCartIcon />}
              >
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
                {currency}
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
                <IMSButton
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  onClick={isEditMode ? handleUpdate : handleSave}
                >
                  {t(isEditMode ? "buttonText.update" : "buttonText.save")}
                  {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                </IMSButton>
              </IMSGrid>
              <IMSGrid item xs={12}>
                {secondaryActions}
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
          <IMSBox>
            {fieldGrid(group.invoice)}
            {fieldGrid(group.customer)}
            {fieldGrid(group.payment)}
            {fieldGrid(group.tender)}
          </IMSBox>
          <IMSBox sx={{ my: 1.5 }}>{summary}</IMSBox>
          <IMSButton
            variant="contained"
            fullWidth
            onClick={() => setDetailsOpen(false)}
          >
            {t("buttonText.done")}
          </IMSButton>
        </IMSDialog>

        {dialogs}
      </>
    );
  }

  /* --------------------------------------------------------- desktop view */

  const fullHeight = {
    height: `calc(100vh - ${DESKTOP_CHROME}px)`,
    "@supports (height: 100dvh)": {
      height: `calc(100dvh - ${DESKTOP_CHROME}px)`,
    },
  };

  return (
    <>
      <IMSStack
        direction="row"
        spacing={2}
        sx={{ ...fullHeight, minHeight: 0, ...hideOnPrint }}
      >
        {/* Left: who it is for, what is being added, and the bill so far. */}
        <IMSStack spacing={2} sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <Card sx={{ p: 2, pb: 2.5, flexShrink: 0, ...rowForm }}>
            {fieldGrid(group.customer)}
          </Card>

          {/* The item bar is its own form, so Enter adds the line. */}
          <IMSForm onSubmit={handleAddData}>
            <Card
              sx={{
                p: 2,
                pb: 3,
                flexShrink: 0,
                borderColor: "primary.main",
                ...rowForm,
              }}
            >
              <IMSBox
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                  gap: 1.5,
                }}
              >
                <IMSBox
                  sx={{
                    flex: "1 1 100%",
                    minWidth: 0,
                    "@media (min-width: 1400px)": { flex: "1 1 200px" },
                  }}
                >
                  {renderField(fieldNamed("itemName"))}
                </IMSBox>
                <IMSBox sx={{ flex: "0 0 96px" }}>
                  {renderField(fieldNamed("itemQuantity"))}
                </IMSBox>
                <IMSBox sx={{ flex: "0 0 96px" }}>
                  {renderField(fieldNamed("quantityCategory"))}
                </IMSBox>
                <IMSBox sx={{ flex: "1 1 96px", minWidth: 0 }}>
                  {renderField(fieldNamed("price"))}
                </IMSBox>
                <IMSButton
                  variant="contained"
                  type="submit"
                  startIcon={<AddShoppingCartIcon />}
                  sx={{ flex: "0 0 auto", minHeight: 41 }}
                >
                  {t("buttonText.addNew")}
                </IMSButton>
              </IMSBox>
            </Card>
          </IMSForm>

          {cart}
        </IMSStack>

        {/* Right: the bill itself — number, payment, total, and Save. */}
        <Card
          sx={{
            width: PANEL_WIDTH,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Scrolls inside itself on a short screen; the page never does. */}
          <IMSBox
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              px: 2,
              pt: 2,
            }}
          >
            {fieldGrid(group.invoice, 1.5)}
            <Divider sx={{ mb: 1.5 }} />
            {fieldGrid(group.payment, 1.5)}
          </IMSBox>

          {/* Pinned: the money and the button that takes it are always in view. */}
          <IMSBox
            sx={{
              flexShrink: 0,
              p: 2,
              pt: 1.5,
              borderTop: `1px solid ${surface.border}`,
              bgcolor: "white.main",
            }}
          >
            <IMSBox>{fieldGrid(group.tender, 1.5)}</IMSBox>
            {summary}
            <IMSStack spacing={1} sx={{ mt: 1.5 }}>
              {saveButton}
              {secondaryActions}
            </IMSStack>
          </IMSBox>
        </Card>
      </IMSStack>

      {dialogs}
    </>
  );
};

export default Dashboard;
