import React from "react";
import { useTranslation } from "react-i18next";

import IMSAutoComplete from "./IMSAutoComplete";
import IMSDatePicker from "./IMSDatePicker";
import IMSGrid from "./IMSGrid";
import IMSRadioGroup from "./IMSRadioGroup";
import IMSSelect from "./IMSSelect";
import IMSTextField from "./IMSTextField";

const IMSFormFields = ({ onChange, error = {}, value = {}, fields = [] }) => {
  const { t } = useTranslation();

  return (
    <IMSGrid container columnSpacing={{ xs: 2, md: 3 }}>
      {fields.map((field) => {
        const message = error?.[field?.name];
        const shared = {
          formLabel: t(field.label),
          name: field.name,
          error: Boolean(message),
          helperText: message,
          onChange: (event, val) =>
            onChange(event, field?.pattern, field?.name, val, field?.label),
        };

        switch (field?.type) {
          case "autoComplete":
            return (
              <IMSGrid item xs={field?.xs ?? 12} md={field?.md} key={field.name}>
                <IMSAutoComplete
                  {...shared}
                  transliterate={field?.transliterate}
                  options={field?.options || []}
                  value={value[field?.name] || ""}
                />
              </IMSGrid>
            );
          case "text":
          case "number":
            return (
              <IMSGrid item xs={field?.xs ?? 12} md={field?.md} key={field.name}>
                <IMSTextField
                  {...shared}
                  type={field?.type}
                  transliterate={field?.transliterate}
                  label=""
                  multiline={field?.multiline}
                  rows={field?.rows}
                  inputProps={field?.inputProps}
                  value={value[field?.name] ?? ""}
                />
              </IMSGrid>
            );
          case "radio":
            return (
              <IMSGrid item xs={field?.xs ?? 12} md={field?.md} key={field.name}>
                <IMSRadioGroup
                  {...shared}
                  list={field?.list}
                  value={value[field?.name] ?? field?.defaultValue ?? ""}
                />
              </IMSGrid>
            );
          case "select":
            return (
              <IMSGrid item xs={field?.xs ?? 12} md={field?.md} key={field.name}>
                <IMSSelect
                  {...shared}
                  menu={field?.menu}
                  // Controlled only: passing defaultValue alongside value made
                  // MUI warn and could show a stale unit.
                  value={value[field?.name] ?? field?.defaultValue ?? ""}
                />
              </IMSGrid>
            );
          case "datePicker":
            return (
              <IMSGrid item xs={field?.xs ?? 12} md={field?.md} key={field.name}>
                <IMSDatePicker
                  {...shared}
                  value={value[field?.name] ?? null}
                />
              </IMSGrid>
            );
          default:
            return null;
        }
      })}
    </IMSGrid>
  );
};

export default IMSFormFields;
