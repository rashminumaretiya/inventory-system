import { Divider, InputAdornment } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

import IMSBox from "./IMSBox";
import IMSStack from "./IMSStack";
import IMSTextField from "./IMSTextField";
import { Search } from "./icon";

/**
 * The row above a list screen: search, optional filters, optional actions.
 *
 * Stacks vertically on a phone with a full-width search and a horizontally
 * scrollable filter strip; becomes a single row from `md` up.
 */
const PageToolbar = ({ search, filters, actions, divider = true }) => {
  const { t } = useTranslation();

  return (
    <>
      <IMSStack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 1.5, md: 2 }}
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: divider ? 2 : 0 }}
      >
        {search && (
          // IMSTextField is always fullWidth inside its own FormControl, so the
          // width has to be constrained from outside or search eats the row.
          <IMSBox sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>
            <IMSTextField
              variant="outlined"
              gutterNone
              name="search"
              placeholder={search.placeholder || t("description.search")}
              value={search.value}
              onChange={search.onChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </IMSBox>
        )}

        {filters && (
          <IMSStack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              // minWidth:0 lets this flex child shrink, so the strip scrolls
              // internally instead of pushing the page wider.
              minWidth: 0,
              ml: { md: "auto" },
              overflowX: "auto",
              pb: { xs: 0.5, md: 0 },
              mx: { xs: -0.5, md: 0 },
              px: { xs: 0.5, md: 0 },
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {filters}
          </IMSStack>
        )}

        {actions && (
          <IMSStack
            direction="row"
            spacing={1}
            sx={{
              ml: { md: filters ? 0 : "auto" },
              flexShrink: 0,
              "& > *": { flex: { xs: 1, md: "none" } },
            }}
          >
            {actions}
          </IMSStack>
        )}
      </IMSStack>
      {divider && <Divider sx={{ mb: { xs: 2, md: 3 } }} />}
    </>
  );
};

export default PageToolbar;
