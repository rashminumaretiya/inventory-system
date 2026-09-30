import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <IMSStack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
      <IMSTypography variant="h4" fontWeight={600} mb={1}>
        404
      </IMSTypography>
      <IMSTypography color="natural.main" mb={2}>
        {t("description.pageNotFound")}
      </IMSTypography>
      <Link to="/">{t("menu.dashboard")}</Link>
    </IMSStack>
  );
};

export default NotFound;
