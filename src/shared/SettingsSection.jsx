import { Divider } from "@mui/material";

import IMSGrid from "./IMSGrid";
import IMSStack from "./IMSStack";
import IMSTypography from "./IMSTypography";

/**
 * A settings row: label and helper text on the left, controls on the right.
 * Collapses to a single column on a phone.
 */
const SettingsSection = ({ title, description, children, divider = true }) => (
  <>
    <IMSGrid
      container
      spacing={{ xs: 1.5, md: 4 }}
      sx={{ py: { xs: 2, md: 3 } }}
    >
      <IMSGrid item xs={12} md={4}>
        <IMSStack>
          <IMSTypography variant="subtitle2">{title}</IMSTypography>
          {description && (
            <IMSTypography variant="body2" color="text.secondary">
              {description}
            </IMSTypography>
          )}
        </IMSStack>
      </IMSGrid>
      <IMSGrid item xs={12} md={8}>
        {children}
      </IMSGrid>
    </IMSGrid>
    {divider && <Divider />}
  </>
);

export default SettingsSection;
