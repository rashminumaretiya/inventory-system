import { CircularProgress, Divider } from "@mui/material";
import React from "react";

import CollectPaymentContainer from "../../container/collectPayment.container";
import IMSButton from "../../shared/IMSButton";
import IMSForm from "../../shared/IMSForm";
import IMSGrid from "../../shared/IMSGrid";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";
import IMSTextField from "../../shared/IMSTextField";
import IMSTypography from "../../shared/IMSTypography";
import { surface } from "../../shared/theme";
import { formatMoney } from "../../utils/billing";
import useSettings from "../../utils/useSettings";

/**
 * Record money received against bills already raised, spread oldest-first so
 * the shopkeeper can just take what the customer hands over.
 */
const CollectPayment = ({ customerName, orders, onSaved }) => {
  const {
    amount,
    setAmount,
    mode,
    setMode,
    modes,
    owed,
    preview,
    error,
    saving,
    handleSubmit,
    formatDate,
    t,
  } = CollectPaymentContainer({ orders, onSaved });
  const { settings } = useSettings();
  const money = (value) => `${settings.currencySymbol}${formatMoney(value)}`;

  return (
    <IMSForm onSubmit={handleSubmit}>
      <IMSStack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          px: 2,
          py: 1.5,
          mb: 2,
          borderRadius: 2,
          bgcolor: "error.light",
          border: `1px solid ${surface.border}`,
        }}
      >
        <IMSStack>
          <IMSTypography fontWeight={600}>{customerName}</IMSTypography>
          <IMSTypography variant="body2" color="text.secondary">
            {t("description.billCount", { count: preview.allocations.length || orders.length })}
          </IMSTypography>
        </IMSStack>
        <IMSStack alignItems="flex-end">
          <IMSTypography variant="caption" color="text.secondary">
            {t("formLabel.balanceDue")}
          </IMSTypography>
          <IMSTypography variant="h6" color="error">
            {money(owed)}
          </IMSTypography>
        </IMSStack>
      </IMSStack>

      <IMSGrid container columnSpacing={2}>
        <IMSGrid item xs={7}>
          <IMSTextField
            type="number"
            name="amount"
            autoFocus
            formLabel={t("formLabel.amountReceived")}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={Boolean(error.amount)}
            helperText={error.amount}
            inputProps={{ min: 0, step: "any" }}
          />
        </IMSGrid>
        <IMSGrid item xs={5}>
          <IMSSelect
            name="mode"
            formLabel={t("formLabel.payment")}
            value={mode}
            menu={modes}
            onChange={(event) => setMode(event.target.value)}
          />
        </IMSGrid>
      </IMSGrid>

      {/* Shows exactly which bills the money clears before anything is saved. */}
      {preview.allocations.length > 0 && (
        <>
          <IMSTypography variant="subtitle2" sx={{ mb: 0.5 }}>
            {t("description.willSettle")}
          </IMSTypography>
          <Divider sx={{ mb: 1 }} />
          {preview.allocations.map(({ order, applied, changes }) => (
            <IMSStack
              key={order.id}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ py: 0.5 }}
            >
              <IMSStack>
                <IMSTypography variant="body2" fontWeight={600}>
                  {order.invoiceNo}
                </IMSTypography>
                <IMSTypography variant="caption" color="text.secondary">
                  {formatDate(order.billingDate)}
                </IMSTypography>
              </IMSStack>
              <IMSStack alignItems="flex-end">
                <IMSTypography variant="body2" fontWeight={600}>
                  {money(applied)}
                </IMSTypography>
                <IMSTypography
                  variant="caption"
                  color={changes.balanceDue > 0 ? "warning.main" : "success.main"}
                >
                  {changes.balanceDue > 0
                    ? t("description.stillDue", {
                        amount: money(changes.balanceDue),
                      })
                    : t("description.settled")}
                </IMSTypography>
              </IMSStack>
            </IMSStack>
          ))}
        </>
      )}

      <IMSStack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <IMSButton
          variant="contained"
          type="submit"
          disabled={saving || preview.allocations.length === 0}
        >
          {t("buttonText.recordPayment")}
          {saving && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </IMSButton>
      </IMSStack>
    </IMSForm>
  );
};

export default CollectPayment;
