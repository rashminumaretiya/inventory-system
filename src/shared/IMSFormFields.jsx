import React from "react";
import IMSGrid from "./IMSGrid";
import IMSAutoComplete from "./IMSAutoComplete";
import IMSTextField from "./IMSTextField";
import IMSRadioGroup from "./IMSRadioGroup";
import IMSDatePicker from "./IMSDatePicker";
import IMSSelect from "./IMSSelect";
import { useTranslation } from "react-i18next";

const IMSFormFields = ({ onChange, error, helperText, value, ...props }) => {
  const { t } = useTranslation();
  return (
    <IMSGrid container columnSpacing={3}>
      {props.fields.map((field, index) => {
        switch (field?.type) {
          case "autoComplete":
            return (
              <IMSGrid item md={field?.md} key={index}>
                <IMSAutoComplete
                  type={field?.type}
                  formLabel={t(field.label)}
                  options={field?.options}
                  onChange={(e, val) =>
                    onChange(e, field?.pattern, field?.name, val, field?.label)
                  }
                  error={error?.[field?.name]}
                  helperText={error?.[field?.name]}
                />
              </IMSGrid>
            );
          case "text":
          case "number":
            return (
              <IMSGrid item md={field?.md} key={index}>
                <IMSTextField
                  type={field?.type}
                  onChange={(e, val) =>
                    onChange(e, field?.pattern, field?.name, val, field?.label)
                  }
                  error={error?.[field?.name]}
                  helperText={error?.[field?.name]}
                  formLabel={t(field.label)}
                  label=""
                  value={value[field?.name] || ""}
                />
              </IMSGrid>
            );
          case "radio":
            return (
              <IMSGrid item md={field?.md} key={index}>
                <IMSRadioGroup
                  onChange={(e, val) =>
                    onChange(e, field?.pattern, field?.name, val, field?.label)
                  }
                  type={field?.type}
                  list={field?.list}
                  error={error?.[field?.name]}
                  helperText={error?.[field?.name]}
                />
              </IMSGrid>
            );
          case "select":
            return (
              <IMSGrid item md={field?.md} key={index}>
                <IMSSelect
                  onChange={(e, val) =>
                    onChange(e, field?.pattern, field?.name, val, field?.label)
                  }
                  type={field?.type}
                  menu={field?.menu}
                  formLabel={t(field.label)}
                  defaultValue={field?.defaultValue}
                  error={error?.[field?.name]}
                  helperText={error?.[field?.name]}
                  value={value[field?.name] || ""}
                />
              </IMSGrid>
            );
          case "datePicker":
            return (
              <IMSGrid item md={field?.md} key={index}>
                <IMSDatePicker
                  type={field?.type}
                  onChange={onChange}
                  error={error[field?.name]}
                  helperText={error[field?.name]}
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
