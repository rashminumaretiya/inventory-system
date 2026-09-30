import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { apiResponse } from "../api";
import { money, num } from "../utils/billing";
import { notifyDataChanged } from "../utils/dataEvents";
import {
  allocatePayment,
  PAYMENT_MODES,
  totalOutstanding,
  unpaidOrders,
} from "../utils/payments";
import validation from "../utils/validation";

/**
 * Taking money against bills already raised.
 *
 * `orders` is everything owed by one customer; the amount is spread across
 * them oldest first, which is how a khata is normally settled.
 */
const CollectPaymentContainer = ({ orders = [], onSaved } = {}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState(PAYMENT_MODES[0]);
  const [error, setError] = useState({});
  const [saving, setSaving] = useState(false);

  const pending = useMemo(() => unpaidOrders(orders), [orders]);
  const owed = useMemo(() => totalOutstanding(pending), [pending]);

  useEffect(() => {
    // Paying the lot is the common case, so it is the default.
    setAmount(owed > 0 ? String(owed) : "");
    setMode(PAYMENT_MODES[0]);
    setError({});
  }, [owed]);

  /** What each bill would receive, shown before anything is saved. */
  const preview = useMemo(
    () => allocatePayment(pending, amount, mode, new Date()),
    [pending, amount, mode]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextError = {
      amount: validation("positiveNumber", amount, "formLabel.amountReceived", t),
    };
    if (!nextError.amount && num(amount) > owed) {
      nextError.amount = t("errorMsg.moreThanOwed", {
        owed: money(owed).toFixed(2),
      });
    }
    setError(nextError);
    if (nextError.amount) return;

    setSaving(true);
    try {
      for (const { order, changes } of preview.allocations) {
        const response = await apiResponse(
          `/orders/${order.id}`,
          "PATCH",
          null,
          changes
        );
        if (!response.success) throw new Error("payment failed");
      }
      notifyDataChanged();
      toast.success(
        t("toast.paymentRecorded", {
          amount: money(preview.allocated).toFixed(2),
          count: preview.allocations.length,
        })
      );
      onSaved?.(preview.allocations);
    } catch {
      toast.error(t("toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return {
    amount,
    setAmount,
    mode,
    setMode,
    modes: PAYMENT_MODES,
    pending,
    owed,
    preview,
    error,
    saving,
    handleSubmit,
    formatDate: (value) => dayjs(value).format("DD/MM/YYYY"),
    t,
  };
};

export default CollectPaymentContainer;
