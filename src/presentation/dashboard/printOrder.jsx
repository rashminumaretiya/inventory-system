import React, { forwardRef } from "react";
import ProductTable from "./productTable";
import { MUIStyled } from "../../shared/MUIStyled";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import IMSTypography from "../../shared/IMSTypography";

const PrintContent = MUIStyled(`div`)(({ theme }) => ({
  visibility: "hidden",
  position: "absolute",
  "@media print": {
    visibility: "visible",
    position: "relative",
  },
}));
const PrintOrder = forwardRef((props, ref) => {
  return (
    <PrintContent ref={ref}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order No.: {props?.formData?.invoiceNo}</TableCell>
            <TableCell align="right">
              Date:
              {new Date(props?.formData?.billingDate).toLocaleDateString()}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2}>
              <ProductTable billingData={props.data} hideAction />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              {props?.formData?.customerInfo?.vendorName && (
                <>
                  <IMSTypography variant="body2">
                    Name: {props?.formData?.customerInfo?.vendorName}
                  </IMSTypography>
                  <IMSTypography variant="body2">
                    Phone: {props?.formData?.customerInfo?.vendorPhone}
                  </IMSTypography>
                  <IMSTypography variant="body2">
                    Address: {props?.formData?.customerInfo?.address}
                  </IMSTypography>
                </>
              )}
            </TableCell>
            <TableCell align="right">
              Total:{" "}
              <IMSTypography variant="body1" component="span" fontWeight="bold">
                {props?.formData?.total}
              </IMSTypography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </PrintContent>
  );
});

export default PrintOrder;
