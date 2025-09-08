import {
  BrowserUpdatedOutlined,
  Download,
  Edit,
  PrintOutlined,
} from "@mui/icons-material";
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
  TableSortLabel,
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
import { Print } from "../dashboard/print";
import { useTranslation } from "react-i18next";
import IMSButton from "../../shared/IMSButton";
import IMSStack from "../../shared/IMSStack";

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
  const { t } = useTranslation();
  const { apiResponse } = ApiContainer();
  const navigate = useNavigate();
  const [orderList, setOrderList] = useState([]);
  const [filterOrderList, setFilterOrderList] = useState([]);
  const [open, setOpen] = React.useState({});
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [searchText, setSearchText] = useState("");
  const [billDate, setBillDate] = useState(null);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState(null);

  const getOrders = async () => {
    try {
      const response = await apiResponse("/orders", "GET");
      if (response.success) {
        setOrderList(response.data);
        setFilterOrderList(response.data);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

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
    searchList = searchList.sort((a, b) => b.id - a.id);
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
      if (response.success) {
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

  const handleRequestSort = (property, type = "string") => {
    const isAsc = orderBy === property && order === "asc";
    const newOrder = isAsc ? "desc" : "asc";
    setOrder(newOrder);
    setOrderBy(property);

    const sortedArray = [...filterOrderList].sort((a, b) => {
      let valA = a[property];
      let valB = b[property];

      if (type === "number") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (type === "date") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = valA ? String(valA).toLowerCase() : "";
        valB = valB ? String(valB).toLowerCase() : "";
      }

      if (valA < valB) return newOrder === "asc" ? -1 : 1;
      if (valA > valB) return newOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilterOrderList(sortedArray);
  };

  useEffect(() => {
    getOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchText, billDate, orderList]);

  const { generateReceipt } = Print();

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const importOrderList = json.orders.filter(
          (item) =>
            !filterOrderList.some((el) => el.invoiceNo === item.invoiceNo)
        );

        if (importOrderList.length === 0) {
          toast.success("No new orders to import");
          return;
        }
        const newData = [...filterOrderList, ...importOrderList].sort(
          (a, b) => b.id - a.id
        );
        try {
          await toast.promise(
            (async () => {
              for (const order of importOrderList) {
                const response = await apiResponse(
                  "/orders",
                  "POST",
                  null,
                  order
                );
                if (!response.success) {
                  throw new Error(`Failed to import order ${order.invoiceNo}`);
                }
              }
              return true;
            })(),
            {
              loading: "Importing...",
              success: "Orders imported successfully",
              error: "Failed to import orders",
            }
          );
          setFilterOrderList(newData);
        } catch {
          toast.error("Something went wrong while importing");
        }
      } catch (err) {
        console.error("Invalid JSON file", err);
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      <IMSGrid container justifyContent="space-between" spacing={3}>
        <IMSGrid item md={4}>
          <IMSTextField
            variant="outlined"
            placeholder={t("description.search")}
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
          <IMSStack direction="row" alignItems="flex-start" gap={2}>
            <IMSDatePicker
              onChange={handleChange}
              slotProps={{
                field: { clearable: true },
              }}
              sx={{ "& .MuiButtonBase-root": { position: "absolute" } }}
            />
            <IMSButton
              component="label"
              variant="contained"
              sx={{
                flex: "none",
                "& input": {
                  clip: "rect(0 0 0 0)",
                  clipPath: "inset(50%)",
                  height: 1,
                  overflow: "hidden",
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  whiteSpace: "nowrap",
                  width: 1,
                },
              }}
            >
              <BrowserUpdatedOutlined sx={{ mr: 1 }} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={(e) => handleImport(e)}
              />
            </IMSButton>
          </IMSStack>
        </IMSGrid>
      </IMSGrid>
      <Divider sx={{ mb: 3 }} />
      <TableContainerStyle>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>
                <TableSortLabel
                  active
                  direction={orderBy === "invoiceNo" ? order : "desc"}
                  onClick={() => handleRequestSort("invoiceNo", "string")}
                >
                  {t("formLabel.invoiceNo")}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active
                  direction={orderBy === "billingDate" ? order : "desc"}
                  onClick={() => handleRequestSort("billingDate", "date")}
                >
                  {t("formLabel.invoiceDate")}
                </TableSortLabel>
              </TableCell>
              <TableCell>{t("formLabel.customerName")}</TableCell>
              <TableCell>{t("formLabel.phoneNumber")}</TableCell>
              <TableCell>
                <TableSortLabel
                  active
                  direction={orderBy === "payment" ? order : "desc"}
                  onClick={() => handleRequestSort("payment", "string")}
                >
                  {t("formLabel.payment")}
                </TableSortLabel>
              </TableCell>
              <TableCell>{t("formLabel.GSTNumber")}</TableCell>
              <TableCell>{t("formLabel.totalPrice")}</TableCell>
              <TableCell>{t("description.action")}</TableCell>
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
                    {t("description.noDataFound")}
                  </IMSTypography>
                </TableCell>
              </TableRow>
            ) : (
              filterOrderList
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
                          sx={{ width: 80 }}
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
                        <IconButton
                          color="primary"
                          onClick={() =>
                            generateReceipt(data?.order, filterOrderList[i])
                          }
                        >
                          <PrintOutlined />
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
        labelRowsPerPage={t("description.rowsPerPage")}
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
