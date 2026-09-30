import CloseIcon from "@mui/icons-material/Close";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

import IMSTypography from "../../shared/IMSTypography";
import { MUIStyled } from "../../shared/MUIStyled";
import { formatMoney, num } from "../../utils/billing";
import { writeCart } from "../../utils/cart";
import useSettings from "../../utils/useSettings";

export const TableContainerStyle = MUIStyled(TableContainer)(({ theme }) => ({
  "& .MuiTableHead-root": {
    "& .MuiTableCell-root": {
      padding: 5,
      position: "sticky",
      top: 0,
      backgroundColor: theme.palette.white.main,
      zIndex: 9,
    },
  },
  "& .MuiTableBody-root, & .MuiTableFooter-root": {
    "& .MuiTableCell-root": { padding: 5 },
  },
  "& .MuiTableFooter-root": {
    "& .MuiTableCell-root": {
      position: "sticky",
      bottom: 0,
      backgroundColor: theme.palette.white.main,
      borderTop: "2px solid #e3e3e3",
      color: theme.palette.black.main,
      fontWeight: 600,
      fontSize: 14,
    },
  },
}));

const ProductTable = ({ billingData = [], setAddData, hideAction, sx }) => {
  const { t } = useTranslation();
  const { settings } = useSettings();

  const handleRemoveItem = (index) => {
    const remaining = billingData.filter((_, i) => i !== index);
    writeCart(remaining);
    setAddData(remaining);
  };

  const lineTotal = billingData.reduce(
    (sum, item) => sum + num(item.subtotal),
    0
  );
  const isEmpty = billingData.length === 0;

  return (
    <TableContainerStyle sx={sx}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>{t("description.serial_no")}</TableCell>
            <TableCell>{t("description.item_name")}</TableCell>
            <TableCell>{t("description.item_qty")}</TableCell>
            <TableCell align="right">{t("description.price")}</TableCell>
            <TableCell align="right">{t("description.total")}</TableCell>
            {!hideAction && (
              <TableCell align="right">{t("description.action")}</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {isEmpty ? (
            <TableRow>
              <TableCell colSpan={hideAction ? 5 : 6}>
                <IMSTypography
                  textAlign="center"
                  lineHeight="80px"
                  color="natural.main"
                >
                  {t("description.noDataFound")}
                </IMSTypography>
              </TableCell>
            </TableRow>
          ) : (
            billingData.map((item, i) => (
              <TableRow key={`${item.id}-${i}`}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{item?.itemName}</TableCell>
                <TableCell>
                  {item?.itemQuantity}{" "}
                  <IMSTypography
                    color="natural.main"
                    variant="body2"
                    component="span"
                  >
                    {item?.quantityCategory}
                  </IMSTypography>
                </TableCell>
                <TableCell align="right">
                  {settings.currencySymbol}
                  {formatMoney(item?.price)}
                </TableCell>
                <TableCell align="right">
                  {settings.currencySymbol}
                  {formatMoney(item?.subtotal)}
                </TableCell>
                {!hideAction && (
                  <TableCell align="right">
                    <Tooltip title={t("buttonText.remove")}>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveItem(i)}
                      >
                        <CloseIcon sx={{ width: 20, height: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
        {!isEmpty && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>
                {t("description.itemsCount", { count: billingData.length })}
              </TableCell>
              <TableCell />
              <TableCell align="right">{t("description.total")}</TableCell>
              <TableCell align="right">
                {settings.currencySymbol}
                {formatMoney(lineTotal)}
              </TableCell>
              {!hideAction && <TableCell />}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainerStyle>
  );
};

export default ProductTable;
