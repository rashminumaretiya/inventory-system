import { Autocomplete } from "@mui/material";
import IMSTextField from "./IMSTextField";
import IMSTypography from "./IMSTypography";
import { useTranslation } from "react-i18next";

import { textMatches } from "../utils/transliterate";

const IMSAutoComplete = ({
  formLabel,
  row,
  options,
  name,
  value,
  onChange,
  inputValue,
  onInputChange,
  error,
  helperText,
  addNew,
  addClick,
  gutterNone,
  transliterate,
  ...props
}) => {
  const { t } = useTranslation();

  /**
   * Match across scripts: "પોત" typed in Gujarati mode still finds an option
   * saved as "Potato", and "pot" typed in English finds "પોટેટો".
   */
  const filterOptions = (list, { inputValue: query, getOptionLabel }) =>
    list.filter((option) => textMatches(getOptionLabel(option), query));

  return (
    <>
      {addNew && (
        <IMSTypography
          onClick={addClick}
          sx={{
            cursor: "pointer",
            float: "right",
            mb: -3,
            position: "relative",
            zIndex: 1,
          }}
          variant="body2"
          color="primary"
        >
          {t(addNew)}
        </IMSTypography>
      )}
      <Autocomplete
        options={options}
        onChange={onChange}
        inputValue={inputValue}
        onInputChange={onInputChange}
        value={value}
        renderInput={(params) => (
          <IMSTextField
            row={row}
            formLabel={formLabel}
            addNew={addNew}
            transliterate={transliterate}
            {...params}
            variant="outlined"
            name={name}
            error={error}
            helperText={helperText}
          />
        )}
        sx={{ flex: 1 }}
        filterOptions={filterOptions}
        {...props}
      />
    </>
  );
};

export default IMSAutoComplete;
