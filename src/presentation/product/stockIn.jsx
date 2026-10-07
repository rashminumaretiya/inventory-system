import { CircularProgress } from "@mui/material";

import StockInContainer from "../../container/stockIn.container";
import IMSButton from "../../shared/IMSButton";
import IMSForm from "../../shared/IMSForm";
import IMSGrid from "../../shared/IMSGrid";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";
import IMSTextField from "../../shared/IMSTextField";
import IMSTypography from "../../shared/IMSTypography";
import { surface } from "../../shared/theme";
import { formatQuantity } from "../../utils/billing";

/** Record goods arriving: the figure typed is added to the shelf, not replacing it. */
const StockIn = ({ product, onSaved }) => {
  const {
    quantity,
    setQuantity,
    unit,
    setUnit,
    units,
    costPrice,
    setCostPrice,
    baseUnit,
    current,
    projected,
    error,
    saving,
    handleSave,
    t,
  } = StockInContainer({ product, onSaved });

  return (
    <IMSForm onSubmit={handleSave}>
      <IMSTypography fontWeight={600} sx={{ mb: 0.5 }}>
        {product?.itemName}
      </IMSTypography>
      <IMSTypography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("description.currentStock", {
          stock: formatQuantity(current),
          unit: baseUnit,
        })}
      </IMSTypography>

      <IMSGrid container columnSpacing={2}>
        <IMSGrid item xs={7}>
          <IMSTextField
            type="number"
            name="quantity"
            formLabel={t("formLabel.received")}
            value={quantity}
            autoFocus
            onChange={(event) => setQuantity(event.target.value)}
            error={Boolean(error.quantity)}
            helperText={error.quantity}
            inputProps={{ min: 0, step: "any" }}
          />
        </IMSGrid>
        <IMSGrid item xs={5}>
          <IMSSelect
            name="unit"
            aria-label={t("formLabel.unit")}
            formLabel={t("formLabel.unit")}
            value={unit}
            menu={units}
            onChange={(event) => setUnit(event.target.value)}
          />
        </IMSGrid>
        <IMSGrid item xs={12}>
          <IMSTextField
            type="number"
            name="costPrice"
            formLabel={t("formLabel.costPriceOptional")}
            value={costPrice}
            onChange={(event) => setCostPrice(event.target.value)}
            inputProps={{ min: 0, step: "any" }}
          />
        </IMSGrid>
      </IMSGrid>

      <IMSStack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          px: 2,
          py: 1.5,
          mb: 2,
          borderRadius: 2,
          bgcolor: "primary.light",
          border: `1px solid ${surface.border}`,
        }}
      >
        <IMSTypography color="primary.dark" fontWeight={600}>
          {t("description.newStock")}
        </IMSTypography>
        <IMSTypography variant="h6" color="primary.dark">
          {formatQuantity(projected)} {baseUnit}
        </IMSTypography>
      </IMSStack>

      <IMSStack direction="row" justifyContent="flex-end">
        <IMSButton variant="contained" type="submit" disabled={saving}>
          {t("buttonText.addStock")}
          {saving && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </IMSButton>
      </IMSStack>
      <IMSTypography
        variant="caption"
        color="natural.main"
        sx={{ mt: 1, display: "block" }}
      >
        {t("description.stockInNote")}
      </IMSTypography>
    </IMSForm>
  );
};

export default StockIn;
