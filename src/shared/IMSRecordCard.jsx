import { Card, CardContent } from "@mui/material";
import React from "react";

import IMSStack from "./IMSStack";
import IMSTypography from "./IMSTypography";

/**
 * One record as a card, for phone-width list screens where a wide table would
 * otherwise scroll sideways. `rows` are label/value pairs shown in two columns.
 */
const IMSRecordCard = ({
  title,
  titleAdornment,
  subtitle,
  rows = [],
  actions,
  footer,
  onClick,
  sx,
}) => (
  <Card
    sx={{
      mb: 1.5,
      ...(onClick && { cursor: "pointer" }),
      ...sx,
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
      <IMSStack direction="row" alignItems="flex-start" spacing={1}>
        <IMSStack sx={{ minWidth: 0, flex: 1 }}>
          <IMSStack direction="row" alignItems="center" spacing={1}>
            <IMSTypography fontWeight={600} noWrap sx={{ minWidth: 0 }}>
              {title}
            </IMSTypography>
            {titleAdornment}
          </IMSStack>
          {subtitle && (
            <IMSTypography variant="body2" color="natural.main" noWrap>
              {subtitle}
            </IMSTypography>
          )}
        </IMSStack>
        {actions && (
          <IMSStack
            direction="row"
            sx={{ flexShrink: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            {actions}
          </IMSStack>
        )}
      </IMSStack>

      {rows.length > 0 && (
        <IMSStack
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: 1.5,
            rowGap: 0.5,
          }}
        >
          {rows.map((row) => (
            <React.Fragment key={row.label}>
              <IMSTypography variant="body2" color="natural.main">
                {row.label}
              </IMSTypography>
              <IMSTypography
                variant="body2"
                textAlign="right"
                fontWeight={row.strong ? 600 : 400}
                color={row.color}
              >
                {row.value}
              </IMSTypography>
            </React.Fragment>
          ))}
        </IMSStack>
      )}

      {footer}
    </CardContent>
  </Card>
);

export default IMSRecordCard;
