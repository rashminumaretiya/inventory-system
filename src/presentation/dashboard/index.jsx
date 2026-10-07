import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Alert,
  Card,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DashboardContainer from "../../container/dashboard.container";
import { fullPageHeight } from "../../shared/FullHeightPage";
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

/** Width of the right-hand bill panel. */
const PANEL_WIDTH = { md: 330, lg: 360, xl: 420 };

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

  const labelFor = (field) => {
    const base =
      isMobile && field.shortLabel ? t(field.shortLabel) : t(field.label);
    if (field.name === "GST") return `${base} (${settings.gstRate}%)`;
    // Required fields say so, rather than only failing on Save.
    return field.required ? `${base} *` : base;
  };

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
            transliterate={field.transliterate}
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
            transliterate={field.transliterate && !disabled}
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
    const errorIn = (name) => {
      const field = fieldNamed(name);
      return field && !isDisabled(field) ? formError[name] : undefined;
    };

    /** Everything that lives in the Bill Details sheet rather than on screen. */
    const sheetCustomer = (group.customer || []).filter(
      (field) => field.name !== "vendorName",
    );
    const sheetFields = [
      ...(group.invoice || []),
      ...sheetCustomer,
      ...(group.payment || []),
      ...(group.tender || []),
    ].map((field) => field.name);
    const sheetHasError = sheetFields.some((name) => errorIn(name));

    /**
     * Save, and if the problem is a field inside the sheet, open the sheet so
     * the shopkeeper sees it instead of a button that silently does nothing.
     */
    const save = async () => {
      const result = await (isEditMode ? handleUpdate() : handleSave());
      if (
        result?.ok === false &&
        Object.keys(result.errors).some((name) => sheetFields.includes(name))
      ) {
        setDetailsOpen(true);
      }
    };

    return (
      <>
        <IMSBox
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
            // Exactly one screen: nothing scrolls except the cart.
            height: `calc(100vh - ${MOBILE_CHROME}px)`,
            "@supports (height: 100dvh)": {
              height: `calc(100dvh - ${MOBILE_CHROME}px)`,
            },
            ...hideOnPrint,
          }}
        >
          {/* Required, so it is on the main screen, not hidden in the sheet. */}
          <Card
            sx={{
              px: 1.5,
              pt: 1.25,
              // Room for the error line, which sits below the field.
              pb: errorIn("vendorName") ? 3.25 : 1.5,
              flexShrink: 0,
              ...rowForm,
            }}
          >
            {renderField(fieldNamed("vendorName"))}
          </Card>

          <IMSForm onSubmit={handleAddData}>
            <Card
              sx={{
                p: 1.5,
                pb: ["itemQuantity", "price"].some(errorIn) ? 3.25 : 1.5,
                ...rowForm,
              }}
            >
              {renderField(fieldNamed("itemName"))}
              <IMSStack
                direction="row"
                spacing={1}
                alignItems="flex-end"
                sx={{ mt: errorIn("itemName") ? 3.25 : 1.25 }}
              >
                <IMSBox sx={{ flex: 1.15, minWidth: 0 }}>
                  {renderField(fieldNamed("itemQuantity"))}
                </IMSBox>
                <IMSBox sx={{ flex: 1, minWidth: 0 }}>
                  {renderField(fieldNamed("quantityCategory"))}
                </IMSBox>
                <IMSBox sx={{ flex: 1.15, minWidth: 0 }}>
                  {renderField(fieldNamed("price"))}
                </IMSBox>
                {/* Inline rather than a full-width row, to leave room for the cart. */}
                <IMSButton
                  variant="contained"
                  type="submit"
                  aria-label={t("buttonText.addNew")}
                  sx={{
                    flexShrink: 0,
                    minWidth: 48,
                    width: 48,
                    height: 44,
                    minHeight: 44,
                    p: 0,
                  }}
                >
                  <AddShoppingCartIcon />
                </IMSButton>
              </IMSStack>
            </Card>
          </IMSForm>

          {cart}

          <IMSBox sx={{ flexShrink: 0 }}>
            {/* Total and Save together: the figure and the button that takes it. */}
            <IMSStack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                p: 1,
                pl: 1.75,
                borderRadius: 2,
                bgcolor: "primary.light",
                border: 1,
                borderColor: "primary.main",
              }}
            >
              <IMSStack sx={{ flex: 1, minWidth: 0 }}>
                <IMSTypography variant="caption" color="primary.dark">
                  {t("description.itemsCount", { count: addData.length })}
                </IMSTypography>
                <IMSTypography
                  color="primary.dark"
                  sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}
                  noWrap
                >
                  {currency}
                  {formatMoney(totals.total)}
                </IMSTypography>
              </IMSStack>
              <IMSButton
                variant="contained"
                disabled={loading}
                onClick={save}
                sx={{ minWidth: 128, minHeight: 48, fontSize: 16 }}
              >
                {t(isEditMode ? "buttonText.update" : "buttonText.save")}
                {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </IMSButton>
            </IMSStack>

            <IMSStack direction="row" spacing={1} sx={{ mt: 1 }}>
              <IMSButton
                variant="outlined"
                // Turns red when something inside it is stopping the save.
                color={sheetHasError ? "error" : "black"}
                startIcon={sheetHasError ? <ErrorOutlineIcon /> : <TuneIcon />}
                onClick={() => setDetailsOpen(true)}
                sx={{ flex: 1.4, minWidth: 0 }}
              >
                {t("description.billDetails")}
              </IMSButton>
              <IMSButton
                variant="outlined"
                startIcon={<PrintOutlinedIcon />}
                disabled={addData?.length === 0}
                onClick={() => generateReceipt(receiptData)}
                sx={{ flex: 1, minWidth: 0 }}
              >
                {t("buttonText.print")}
              </IMSButton>
              <IMSButton
                variant="outlined"
                color="black"
                onClick={isEditMode ? handleClearAll : handleCancel}
                sx={{ flex: 1, minWidth: 0 }}
              >
                {t(isEditMode ? "buttonText.clearAll" : "buttonText.cancel")}
              </IMSButton>
            </IMSStack>
          </IMSBox>
        </IMSBox>

        {/* Optional details for this bill. Customer Name is not repeated here:
            it is on the main screen, where a required field belongs. */}
        <IMSDialog
          title={t("description.billDetails")}
          open={detailsOpen}
          handleClose={() => setDetailsOpen(false)}
          maxWidth="sm"
        >
          {sheetHasError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t("description.fixHighlighted")}
            </Alert>
          )}
          {fieldGrid(group.invoice)}
          {fieldGrid(sheetCustomer)}
          {fieldGrid(group.payment)}
          {fieldGrid(group.tender)}
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

  return (
    <>
      <IMSStack
        direction="row"
        spacing={2}
        sx={{ ...fullPageHeight, minHeight: 0, ...hideOnPrint }}
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
