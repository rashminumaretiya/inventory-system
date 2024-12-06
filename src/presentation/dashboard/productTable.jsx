import CloseIcon from "@mui/icons-material/Close";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";
import IMSTypography from "../../shared/IMSTypography";
import { MUIStyled } from "../../shared/MUIStyled";

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
  "& .MuiTableBody-root": {
    "& .MuiTableCell-root": {
      padding: 5,
    },
  },
}));
const ProductTable = ({ billingData, setAddData, hideAction, sx }) => {
  const handleRemoveItem = (index) => {
    const filterData = billingData.filter((_, i) => i !== index);
    localStorage.setItem("formData", JSON.stringify([...filterData]));
    setAddData([...filterData]);
  };
  return (
    <TableContainerStyle sx={sx}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>SNo.</TableCell>
            <TableCell>Item Name</TableCell>
            <TableCell>Item Qty</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Total</TableCell>
            {!hideAction && <TableCell align="right">Action</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(billingData)?.length === 0 ||
          billingData?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <IMSTypography
                  textAlign="center"
                  lineHeight="80px"
                  color="natural.main"
                >
                  No Data Added
                </IMSTypography>
              </TableCell>
            </TableRow>
          ) : (
            billingData?.map((item, i) => (
              <TableRow>
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
                <TableCell align="right">{item?.price}</TableCell>
                <TableCell align="right">{item?.subtotal}</TableCell>
                {!hideAction && (
                  <TableCell align="right">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleRemoveItem(i)}
                    >
                      <CloseIcon sx={{ width: 20, height: 20 }} />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainerStyle>
  );
};

export default ProductTable;
