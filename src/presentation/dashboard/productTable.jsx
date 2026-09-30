import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import {
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

import IMSBox from "../../shared/IMSBox";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import { MUIStyled } from "../../shared/MUIStyled";
import QuantityStepper from "../../shared/QuantityStepper";
import { formatMoney, num } from "../../utils/billing";
import { writeCart } from "../../utils/cart";
import useSettings from "../../utils/useSettings";

export const TableContainerStyle = MUIStyled(TableContainer)(({ theme }) => ({
  "& .MuiTableHead-root": {
    "& .MuiTableCell-root": {
      padding: "8px 10px",
      position: "sticky",
      top: 0,
      backgroundColor: theme.palette.white.main,
      zIndex: 9,
      fontWeight: 600,
    },
  },
  "& .MuiTableBody-root": {
    "& .MuiTableCell-root": { padding: "8px 10px" },
  },
  "& .MuiTableFooter-root": {
    "& .MuiTableCell-root": {
      position: "sticky",
      bottom: 0,
      padding: "8px 10px",
      backgroundColor: theme.palette.white.main,
      borderTop: "2px solid #e3e3e3",
      color: theme.palette.black.main,
      fontWeight: 600,
      fontSize: 14,
    },
  },
}));

const ProductTable = ({
  billingData = [],
  setAddData,
  onStepLine,
  onRemoveLine,
  hideAction,
  // The phone till shows the total in its own bar, so the footer would repeat it.
  hideTotal,
  sx,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { settings } = useSettings();

  const handleRemoveItem = (index) => {
    if (onRemoveLine) {
      onRemoveLine(index);
      return;
    }
    const remaining = billingData.filter((_, i) => i !== index);
    writeCart(remaining);
    setAddData(remaining);
  };

  const lineTotal = billingData.reduce(
    (sum, item) => sum + num(item.subtotal),
    0
  );
  const isEmpty = billingData.length === 0;

  const empty = (
    <IMSStack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{ py: 5, px: 2 }}
    >
      <ShoppingCartOutlinedIcon sx={{ fontSize: 40, color: "natural.main" }} />
      <IMSTypography color="natural.main" textAlign="center">
        {t("description.noDataFound")}
      </IMSTypography>
    </IMSStack>
  );

  /* A phone gets a scrollable list plus a pinned total rather than a table. */
  if (isMobile) {
    return (
      <IMSBox
        sx={{ display: "flex", flexDirection: "column", minHeight: 0, ...sx }}
      >
        {isEmpty ? (
          empty
        ) : (
          <>
            <IMSBox sx={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              {billingData.map((item, i) => (
                <IMSStack
                  key={`${item.id}-${i}`}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderBottom: "1px solid #eef1f1",
                  }}
                >
                  <IMSTypography
                    variant="body2"
                    color="natural.main"
                    sx={{ width: 20, flexShrink: 0 }}
                  >
                    {i + 1}
                  </IMSTypography>
                  <IMSStack sx={{ minWidth: 0, flex: 1 }} spacing={0.5}>
                    <IMSTypography fontWeight={600} noWrap>
                      {item?.itemName}
                    </IMSTypography>
                    {onStepLine ? (
                      <QuantityStepper
                        quantity={item?.itemQuantity}
                        unit={item?.quantityCategory}
                        onStep={(direction) => onStepLine(i, direction)}
                      />
                    ) : (
                      <IMSTypography variant="body2" color="natural.main">
                        {item?.itemQuantity} {item?.quantityCategory}
                      </IMSTypography>
                    )}
                  </IMSStack>
                  <IMSTypography fontWeight={600} sx={{ flexShrink: 0 }}>
                    {settings.currencySymbol}
                    {formatMoney(item?.subtotal)}
                  </IMSTypography>
                  {!hideAction && (
                    <IconButton
                      color="error"
                      size="small"
                      aria-label={t("buttonText.remove")}
                      onClick={() => handleRemoveItem(i)}
                      sx={{ flexShrink: 0 }}
                    >
                      <CloseIcon sx={{ width: 18, height: 18 }} />
                    </IconButton>
                  )}
                </IMSStack>
              ))}
            </IMSBox>
            {!hideTotal && <Divider />}
            {!hideTotal && (
            <IMSStack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ px: 1.5, py: 1.25, flexShrink: 0 }}
            >
              <IMSTypography variant="body2" color="natural.main">
                {t("description.itemsCount", { count: billingData.length })}
              </IMSTypography>
              <IMSTypography variant="h6">
                {settings.currencySymbol}
                {formatMoney(lineTotal)}
              </IMSTypography>
            </IMSStack>
            )}
          </>
        )}
      </IMSBox>
    );
  }

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
              <TableCell colSpan={hideAction ? 5 : 6} sx={{ border: 0 }}>
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            billingData.map((item, i) => (
              <TableRow key={`${item.id}-${i}`} hover>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{item?.itemName}</TableCell>
                <TableCell>
                  {onStepLine ? (
                    <QuantityStepper
                      quantity={item?.itemQuantity}
                      unit={item?.quantityCategory}
                      onStep={(direction) => onStepLine(i, direction)}
                    />
                  ) : (
                    <>
                      {item?.itemQuantity}{" "}
                      <IMSTypography
                        color="natural.main"
                        variant="body2"
                        component="span"
                      >
                        {item?.quantityCategory}
                      </IMSTypography>
                    </>
                  )}
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
        {!isEmpty && !hideTotal && (
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
