import { Edit } from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Chip,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ApiContainer } from "../../api";
import { Search } from "../../shared/icon";
import IMSDatePicker from "../../shared/IMSDatePicker";
import IMSGrid from "../../shared/IMSGrid";
import IMSTextField from "../../shared/IMSTextField";
import IMSTypography from "../../shared/IMSTypography";
import { MUIStyled } from "../../shared/MUIStyled";

export const TableContainerStyle = MUIStyled(TableContainer)(({ theme }) => ({
  maxHeight: "calc(100vh - 186px)",
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
      "& .MuiCollapse-wrapper": {
        backgroundColor: "#f7f7f7",
        "& .MuiTableHead-root": {
          "& .MuiTableCell-root": {
            backgroundColor: "transparent",
          },
        },
      },
    },
  },
}));

const Orders = () => {
  const { apiResponse } = ApiContainer();
  const [orderList, setOrderList] = useState([]);
  const [filterOrderList, setFilterOrderList] = useState([]);
  const [open, setOpen] = React.useState({});
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [searchText, setSearchText] = useState("");
  const [billDate, setBillDate] = useState(null);
  const navigate = useNavigate();

  const getOrders = async () => {
    try {
      const response = await apiResponse("/orders", "GET");
      if (response) {
        setOrderList(response.data);
        setFilterOrderList(response.data);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    getOrders();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  const applyFilters = () => {
    let searchList = [...orderList];
    if (searchText) {
      searchList = searchList.filter((el) =>
        el?.customerInfo?.vendorName
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
    }

    if (billDate) {
      searchList = searchList.filter(
        (el) =>
          dayjs(el?.billingDate)?.$d.toLocaleDateString() ===
          billDate.toLocaleDateString()
      );
    }
    setFilterOrderList(searchList);
    setPage(0);
  };
  const handleChange = (e) => {
    if (e?.target) {
      setSearchText(e.target.value);
    } else {
      setBillDate(e?.$d);
    }
  };

  const handleDeleteOrder = async (e, id) => {
    e.stopPropagation();
    const filteredData = orderList.filter((item) => item.id === id);
    try {
      const response = await apiResponse(
        `/orders/${id}`,
        "DELETE",
        filteredData
      );
      if (response) {
        toast.success("Order deleted successfully");
        setOrderList(orderList.filter((item) => item.id !== id));
      }
    } catch {
      toast.error("Something went wrong");
    }
  };
  const handleEditOrder = (e, id) => {
    e.stopPropagation();
    navigate(`/?order/${id}`);
  };

  useEffect(() => {
    applyFilters();
  }, [searchText, billDate, orderList]);

  return (
    <>
      <IMSGrid container justifyContent="space-between" spacing={3}>
        <IMSGrid item md={4}>
          <IMSTextField
            variant="outlined"
            placeholder="Search..."
            gutterNone
            name="search"
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </IMSGrid>
        <IMSGrid item md={4}>
          <IMSDatePicker
            onChange={handleChange}
            slotProps={{
              field: { clearable: true },
            }}
            sx={{ "& .MuiButtonBase-root": { position: "absolute" } }}
          />
        </IMSGrid>
      </IMSGrid>
      <Divider sx={{ mb: 3 }} />
      <TableContainerStyle>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Invoice No</TableCell>
              <TableCell>Invoice Date</TableCell>
              <TableCell>User Name</TableCell>
              <TableCell>User Phone</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>GST Number</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filterOrderList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
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
              filterOrderList
                .sort((a, b) => b.id - a.id)
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((data, i) => (
                  <>
                    <TableRow
                      key={i}
                      onClick={() => setOpen(open === i ? null : i)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <IconButton
                          aria-label="expand row"
                          size="small"
                          onClick={() => setOpen(open === i ? null : i)}
                        >
                          {open === i ? (
                            <KeyboardArrowUpIcon />
                          ) : (
                            <KeyboardArrowDownIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>{data?.invoiceNo}</TableCell>
                      <TableCell>
                        {new Date(data?.billingDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{data?.customerInfo.vendorName}</TableCell>
                      <TableCell>{data?.customerInfo.vendorPhone}</TableCell>
                      <TableCell>
                        <Chip
                          label={data?.payment}
                          size="small"
                          color={
                            data?.payment === "Pending"
                              ? "warning"
                              : data?.payment === "Online"
                              ? "primary"
                              : "success"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {data?.GSTNumber ? data?.GSTNumber : "N/A"}
                      </TableCell>
                      <TableCell>{data?.total}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleEditOrder(e, data?.id)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={(e) => handleDeleteOrder(e, data?.id)}
                          color="error"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Collapse in={open === i} timeout="auto" unmountOnExit>
                          <Table size="small" aria-label="purchases">
                            <TableHead>
                              <TableRow>
                                <TableCell>Item Name</TableCell>
                                <TableCell>Item Qty</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Sub Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {data?.order?.map((item, index) => (
                                <TableRow key={item.date}>
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
                                  <TableCell>{item?.price}</TableCell>
                                  <TableCell>{item?.subtotal}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainerStyle>
      <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={filterOrderList ? filterOrderList.length : orderList.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default Orders;
