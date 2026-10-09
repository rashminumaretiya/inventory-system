import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { FormControlLabel, Switch } from "@mui/material";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import IMSButton from "../../shared/IMSButton";
import IMSDialog from "../../shared/IMSDialog";
import IMSForm from "../../shared/IMSForm";
import IMSFormFields from "../../shared/IMSFormFields";
import IMSStack from "../../shared/IMSStack";
import IMSTabs from "../../shared/IMSTabs";
import IMSTypography from "../../shared/IMSTypography";
import PageHeader from "../../shared/PageHeader";
import SettingsSection from "../../shared/SettingsSection";
import { lastBackupDate, runBackup } from "../../utils/backup";
import { defaultSettings, settingsFields } from "../../utils/settings";
import { useAuth } from "../../utils/AuthContext";
import useSettings from "../../utils/useSettings";
import ChangePin from "../lock/ChangePin";
import validation from "../../utils/validation";

/** Which settings field belongs on which tab. */
const TAB_FIELDS = {
  shop: ["shopName", "shopPhone", "shopGSTIN", "shopAddress"],
  billing: [
    "invoicePrefix",
    "gstRate",
    "lowStockThreshold",
    "billPaper",
    "billLanguage",
    "receiptFooter",
    "upiId",
    "upiName",
  ],
  security: ["autoLockMinutes"],
};

const fieldsFor = (names) =>
  names.map((name) => settingsFields.find((field) => field.name === name));

const Settings = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { lock } = useAuth();
  // Another screen can open a tab, e.g. billing's "Add UPI ID".
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "shop");
  const [formData, setFormData] = useState(settings);
  const [error, setError] = useState({});
  const [backingUp, setBackingUp] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [lastBackup, setLastBackup] = useState(lastBackupDate());

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

    const firstBad = settingsFields.find((field) => nextError[field.name]);
    if (firstBad) {
      // Send them to the tab holding the problem rather than failing silently.
      const owner = Object.entries(TAB_FIELDS).find(([, names]) =>
        names.includes(firstBad.name)
      );
      if (owner) setTab(owner[0]);
      return;
    }

    updateSettings({
      ...formData,
      gstRate: Number(formData.gstRate),
      lowStockThreshold: Number(formData.lowStockThreshold),
      backupHour: Number(formData.backupHour),
      autoLockMinutes: Number(formData.autoLockMinutes),
      shopGSTIN: formData.shopGSTIN?.trim().toUpperCase() || "",
      upiId: formData.upiId?.trim() || "",
      upiName: formData.upiName?.trim() || "",
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
      setLastBackup(lastBackupDate());
      toast.success(t("toast.backupDownloaded"));
    } catch (error_) {
      toast.error(t("toast.backupFailed", { message: error_.message }));
    } finally {
      setBackingUp(false);
    }
  };

  /** Switches save straight away; there is nothing to validate. */
  const toggle = (name) => (event) => {
    const checked = event.target.checked;
    setFormData((prev) => ({ ...prev, [name]: checked }));
    updateSettings({ [name]: checked });
  };

  /** Select options may carry a `labelKey`; they are shown translated. */
  const translated = (field) =>
    field.menu
      ? {
          ...field,
          menu: field.menu.map((item) =>
            item.labelKey ? { ...item, label: t(item.labelKey) } : item
          ),
        }
      : field;

  const fieldGroup = (names) => (
    <IMSFormFields
      onChange={handleChange}
      error={error}
      fields={fieldsFor(names).map(translated)}
      value={formData}
    />
  );

  return (
    <>
      <PageHeader
        title={t("menu.settings")}
        subtitle={t("pageSubtitle.settings")}
        divider={false}
      />

      <IMSTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "shop", label: t("description.shopDetails") },
          { value: "billing", label: t("description.billingSection") },
          { value: "notifications", label: t("notifications.title") },
          { value: "security", label: t("description.securityTitle") },
          { value: "backup", label: t("description.backupTitle") },
        ]}
      />

      <IMSForm onSubmit={handleSave}>
        {tab === "shop" && (
          <>
            <SettingsSection
              title={t("description.shopIdentity")}
              description={t("description.shopIdentityHelp")}
            >
              {fieldGroup(["shopName", "shopPhone"])}
            </SettingsSection>
            <SettingsSection
              title={t("description.taxIdentity")}
              description={t("description.taxIdentityHelp")}
            >
              {fieldGroup(["shopGSTIN", "shopAddress"])}
            </SettingsSection>
          </>
        )}

        {tab === "billing" && (
          <>
            <SettingsSection
              title={t("description.invoiceSection")}
              description={t("description.invoiceSectionHelp")}
            >
              {fieldGroup(["invoicePrefix", "gstRate"])}
            </SettingsSection>
            <SettingsSection
              title={t("formLabel.lowStockThreshold")}
              description={t("description.lowStockHelp")}
            >
              {fieldGroup(["lowStockThreshold"])}
            </SettingsSection>
            <SettingsSection
              title={t("description.printedBill")}
              description={t("description.printedBillHelp")}
            >
              {fieldGroup(["billPaper", "billLanguage"])}
            </SettingsSection>
            <SettingsSection
              title={t("description.upiSection")}
              description={t("description.upiSectionHelp")}
            >
              {fieldGroup(["upiId", "upiName"])}
            </SettingsSection>
            <SettingsSection
              title={t("formLabel.receiptFooter")}
              description={t("description.receiptFooterHelp")}
            >
              {fieldGroup(["receiptFooter"])}
            </SettingsSection>
          </>
        )}

        {tab === "notifications" && (
          <SettingsSection
            title={t("notifications.title")}
            description={t("notifications.settingsHelp")}
          >
            <IMSStack>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyPendingPayments !== false}
                    onChange={toggle("notifyPendingPayments")}
                  />
                }
                label={t("notifications.pendingSwitch")}
              />
              <IMSTypography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 6, mt: -0.5, mb: 1 }}
              >
                {t("notifications.pendingSwitchHelp")}
              </IMSTypography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyLowStock !== false}
                    onChange={toggle("notifyLowStock")}
                  />
                }
                label={t("notifications.lowStockSwitch")}
              />
              <IMSTypography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 6, mt: -0.5 }}
              >
                {t("notifications.lowStockSwitchHelp")}
              </IMSTypography>
            </IMSStack>
          </SettingsSection>
        )}

        {tab === "security" && (
          <>
            <SettingsSection
              title={t("formLabel.autoLockMinutes")}
              description={t("description.autoLockHelp")}
            >
              <IMSStack spacing={1} alignItems="flex-start">
                {fieldGroup(["autoLockMinutes"])}
                {/* Matches the grid gutter so it lines up under the field. */}
                <IMSTypography
                  variant="body2"
                  color="text.secondary"
                  sx={{ pl: { xs: 2, md: 3 }, mt: -1 }}
                >
                  {Number(formData.autoLockMinutes) > 0
                    ? t("description.autoLockOn", {
                        minutes: Number(formData.autoLockMinutes),
                      })
                    : t("description.autoLockOff")}
                </IMSTypography>
              </IMSStack>
            </SettingsSection>
            <SettingsSection
              title={t("description.pinTitle")}
              description={t("description.pinHelp")}
            >
              <IMSStack direction="row" spacing={1.5} flexWrap="wrap" rowGap={1.5}>
                <IMSButton
                  variant="outlined"
                  onClick={() => setChangingPin(true)}
                >
                  {t("buttonText.changePin")}
                </IMSButton>
                <IMSButton
                  variant="outlined"
                  color="black"
                  startIcon={<LockOutlinedIcon />}
                  onClick={lock}
                >
                  {t("buttonText.lockNow")}
                </IMSButton>
              </IMSStack>
            </SettingsSection>
          </>
        )}

        {tab === "backup" && (
          <>
            <SettingsSection
              title={t("formLabel.autoBackup")}
              description={t("description.backupHelp")}
            >
              <IMSStack spacing={1.5} alignItems="flex-start">
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(formData.autoBackup)}
                      onChange={toggle("autoBackup")}
                    />
                  }
                  label={t("formLabel.autoBackup")}
                />
                {fieldGroup(["backupHour"])}
                <IMSTypography variant="body2" color="text.secondary">
                  {lastBackup
                    ? t("description.lastBackup", { date: lastBackup })
                    : t("description.noBackupYet")}
                </IMSTypography>
              </IMSStack>
            </SettingsSection>
            <SettingsSection
              title={t("buttonText.backupNow")}
              description={t("description.backupNowHelp")}
            >
              <IMSButton
                variant="outlined"
                onClick={handleBackupNow}
                disabled={backingUp}
              >
                {t("buttonText.backupNow")}
              </IMSButton>
            </SettingsSection>
          </>
        )}

        <IMSStack
          direction={{ xs: "column-reverse", sm: "row" }}
          justifyContent="flex-end"
          spacing={1.5}
          sx={{ py: 3 }}
        >
          <IMSButton variant="outlined" color="black" onClick={handleReset}>
            {t("buttonText.resetDefaults")}
          </IMSButton>
          <IMSButton variant="contained" type="submit">
            {t("buttonText.save")}
          </IMSButton>
        </IMSStack>
      </IMSForm>

      <IMSDialog
        title={t("buttonText.changePin")}
        open={changingPin}
        maxWidth="xs"
        handleClose={() => setChangingPin(false)}
      >
        <ChangePin onDone={() => setChangingPin(false)} />
      </IMSDialog>
    </>
  );
};

export default Settings;
