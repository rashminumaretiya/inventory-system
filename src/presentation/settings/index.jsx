import { Card, Divider, FormControlLabel, Switch } from "@mui/material";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import IMSButton from "../../shared/IMSButton";
import IMSForm from "../../shared/IMSForm";
import IMSFormFields from "../../shared/IMSFormFields";
import IMSGrid from "../../shared/IMSGrid";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import { runBackup } from "../../utils/backup";
import { defaultSettings, settingsFields } from "../../utils/settings";
import useSettings from "../../utils/useSettings";
import validation from "../../utils/validation";

/**
 * Shop-wide settings. These drive the GST rate used on every bill, the
 * low-stock warnings, the invoice prefix and what the printed receipt says,
 * all of which used to be hard-coded.
 */
const Settings = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState(settings);
  const [error, setError] = useState({});
  const [backingUp, setBackingUp] = useState(false);

  const handleChange = (event, pattern, sName, val, label) => {
    const name = event?.target?.name || sName;
    const value = event?.target ? event.target.value : val;
    setError((prev) => ({
      ...prev,
      [name]: validation(pattern, value, label, t),
    }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();

    const nextError = {};
    settingsFields.forEach((field) => {
      if (!field.pattern) return;
      nextError[field.name] = validation(
        field.pattern,
        formData[field.name],
        field.label,
        t
      );
    });
    setError(nextError);
    if (!Object.values(nextError).every((message) => !message)) return;

    updateSettings({
      ...formData,
      gstRate: Number(formData.gstRate),
      lowStockThreshold: Number(formData.lowStockThreshold),
      backupHour: Number(formData.backupHour),
      shopGSTIN: formData.shopGSTIN?.trim().toUpperCase() || "",
    });
    toast.success(t("toast.settingsSaved"));
  };

  const handleReset = () => {
    setFormData(defaultSettings);
    setError({});
    updateSettings(defaultSettings);
    toast.success(t("toast.settingsReset"));
  };

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      await runBackup({ force: true });
      toast.success(t("toast.backupDownloaded"));
    } catch (error_) {
      toast.error(t("toast.backupFailed", { message: error_.message }));
    } finally {
      setBackingUp(false);
    }
  };

  const toggleAutoBackup = (event) => {
    const autoBackup = event.target.checked;
    setFormData((prev) => ({ ...prev, autoBackup }));
    updateSettings({ autoBackup });
  };

  return (
    <IMSGrid container spacing={3}>
      <IMSGrid item md={8}>
        <Card
          elevation={0}
          sx={{ p: 3, borderRadius: 2, boxShadow: "0 0 10px rgba(0,0,0,0.2)" }}
        >
          <IMSTypography variant="h6" fontWeight={600} mb={2}>
            {t("menu.settings")}
          </IMSTypography>
          <Divider sx={{ mb: 3 }} />
          <IMSForm onSubmit={handleSave}>
            <IMSFormFields
              onChange={handleChange}
              error={error}
              fields={settingsFields}
              value={formData}
            />
            <IMSStack direction="row" justifyContent="flex-end" spacing={1}>
              <IMSButton variant="outlined" color="black" onClick={handleReset}>
                {t("buttonText.resetDefaults")}
              </IMSButton>
              <IMSButton variant="contained" type="submit">
                {t("buttonText.save")}
              </IMSButton>
            </IMSStack>
          </IMSForm>
        </Card>
      </IMSGrid>

      <IMSGrid item md={4}>
        <Card
          elevation={0}
          sx={{ p: 3, borderRadius: 2, boxShadow: "0 0 10px rgba(0,0,0,0.2)" }}
        >
          <IMSTypography variant="h6" fontWeight={600} mb={1}>
            {t("description.backupTitle")}
          </IMSTypography>
          <IMSTypography variant="body2" color="natural.main" mb={2}>
            {t("description.backupHelp")}
          </IMSTypography>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(formData.autoBackup)}
                onChange={toggleAutoBackup}
              />
            }
            label={t("formLabel.autoBackup")}
          />
          <IMSStack mt={2}>
            <IMSButton
              variant="contained"
              onClick={handleBackupNow}
              disabled={backingUp}
            >
              {t("buttonText.backupNow")}
            </IMSButton>
          </IMSStack>
        </Card>
      </IMSGrid>
    </IMSGrid>
  );
};

export default Settings;
