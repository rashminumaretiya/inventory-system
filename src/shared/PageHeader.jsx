import { Divider } from "@mui/material";

import IMSStack from "./IMSStack";
import IMSTypography from "./IMSTypography";

/**
 * Page title, one-line description and optional actions.
 * Actions drop below the title on a phone so neither gets squeezed.
 */
const PageHeader = ({ title, subtitle, actions, divider = true }) => (
  <>
    <IMSStack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "stretch", sm: "flex-start" }}
      spacing={{ xs: 1.5, sm: 2 }}
      sx={{ mb: divider ? 2 : 0 }}
    >
      <IMSStack sx={{ minWidth: 0, flex: 1 }}>
        <IMSTypography
          variant="h5"
          sx={{ fontSize: { xs: "1.35rem", md: "1.6rem" } }}
        >
          {title}
        </IMSTypography>
        {subtitle && (
          <IMSTypography color="text.secondary" sx={{ mt: 0.25 }}>
            {subtitle}
          </IMSTypography>
        )}
      </IMSStack>
      {actions && (
        <IMSStack
          direction="row"
          spacing={1}
          sx={{ flexShrink: 0, "& > *": { flex: { xs: 1, sm: "none" } } }}
        >
          {actions}
        </IMSStack>
      )}
    </IMSStack>
    {divider && <Divider sx={{ mb: { xs: 2, md: 3 } }} />}
  </>
);

export default PageHeader;
