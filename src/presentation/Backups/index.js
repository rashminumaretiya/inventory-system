import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { backupDoneToday, msUntilHour, runBackup } from "../../utils/backup";
import useSettings from "../../utils/useSettings";

/**
 * Downloads a full JSON backup once a day.
 *
 * The previous version listed `apiResponse` as an effect dependency while that
 * function was rebuilt on every render, so the effect re-ran continuously and
 * the interval it created inside a setTimeout callback was never cleared.
 */
const Backups = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const timerRef = useRef(null);

  const autoBackup = settings.autoBackup;
  const backupHour = Number(settings.backupHour);

  useEffect(() => {
    if (!autoBackup) return undefined;

    let cancelled = false;

    const attempt = async () => {
      if (cancelled || backupDoneToday()) return;
      try {
        const result = await runBackup();
        if (result.status === "downloaded") {
          toast.success(t("toast.backupDownloaded"));
        }
      } catch (error) {
        toast.error(t("toast.backupFailed", { message: error.message }));
      }
    };

    /** Chained timeouts, so each wake-up recomputes the next target time. */
    const scheduleNext = () => {
      const delay = msUntilHour(
        Number.isInteger(backupHour) && backupHour >= 0 && backupHour <= 23
          ? backupHour
          : 10
      );
      timerRef.current = setTimeout(async () => {
        await attempt();
        if (!cancelled) scheduleNext();
      }, delay);
    };

    // Catch up if the till was closed when the scheduled time passed.
    attempt();
    scheduleNext();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoBackup, backupHour, t]);

  return null;
};

export default Backups;
