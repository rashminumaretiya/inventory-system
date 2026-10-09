import { Edit } from "@mui/icons-material";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { apiResponse } from "../../api";
import IMSButton from "../../shared/IMSButton";
import IMSDialog from "../../shared/IMSDialog";
import IMSRecordCard from "../../shared/IMSRecordCard";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import FullHeightPage from "../../shared/FullHeightPage";
import PageHeader from "../../shared/PageHeader";
import PageToolbar from "../../shared/PageToolbar";
import { MUIStyled } from "../../shared/MUIStyled";
import {
  productRemoved,
  selectProducts,
  setProducts,
} from "../../store/slice/productSlice";
import {
  baseUnitOf,
  formatMoney,
  formatQuantity,
  productStockInBase,
  stockStatus,
} from "../../utils/billing";
import { notifyDataChanged } from "../../utils/dataEvents";
import { textMatches } from "../../utils/transliterate";
import useSettings from "../../utils/useSettings";
import AddProduct from "../dashboard/addProduct";
import EditProduct from "./editProduct";
import StockIn from "./stockIn";

export const TableContainerStyle = MUIStyled(TableContainer)(({ theme }) => ({
  // Fills whatever height is left on the page and scrolls inside itself.
  flex: 1,
  minHeight: 0,
  // A frame around the whole table, matching the cards elsewhere.
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  // Tuck the last row's line under the frame, so the bottom edge is not
  // drawn twice.
  "& .MuiTable-root": { marginBottom: -1 },
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
}));

const Product = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const { settings } = useSettings();
  const location = useLocation();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [show, setShow] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState({});
  const [editData, setEditData] = useState(null);
  const [editProductDialog, setEditProductDialog] = useState(false);
  const [stockInProduct, setStockInProduct] = useState(null);

  // Arriving from a low-stock notification pre-fills the search; Quick Search
  // can also ask for a status filter or the Add Product dialog.
  useEffect(() => {
    if (location.state?.search) setSearchText(location.state.search);
    if (location.state?.statusFilter)
      setStatusFilter(location.state.statusFilter);
    if (location.state?.add) setShow(true);
  }, [location.state]);

  const load = useCallback(async () => {
    try {
      const response = await apiResponse("/product", "GET");
      if (response.success) dispatch(setProducts(response.data));
    } catch {
      toast.error(t("toast.loadFailed"));
    }
  }, [dispatch, t]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const result = { all: products.length, low: 0, out: 0 };
    products.forEach((product) => {
      const status = stockStatus(product, settings.lowStockThreshold);
      if (status === "low") result.low += 1;
      if (status === "out") result.out += 1;
    });
    return result;
  }, [products, settings.lowStockThreshold]);

  /** Derived, so the redux list is never sorted in place. */
  const visibleProducts = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return products
      .filter((product) => (term ? textMatches(product.itemName, term) : true))
      .filter((product) =>
        statusFilter === "all"
          ? true
          : stockStatus(product, settings.lowStockThreshold) === statusFilter,
      )
      .slice()
      .sort((a, b) => (a.itemName || "").localeCompare(b.itemName || ""));
  }, [products, searchText, statusFilter, settings.lowStockThreshold]);

  useEffect(() => setPage(0), [searchText, statusFilter]);

  const handleDeleteProduct = async (id) => {
    try {
      const response = await apiResponse(`/product/${id}`, "DELETE");
      if (response.success) {
        dispatch(productRemoved(id));
        setDeleteProduct({ show: false });
        notifyDataChanged();
        toast.success(t("toast.productDeleted"));
      }
    } catch {
      toast.error(t("toast.saveFailed"));
    }
  };

  const statusChip = (product) => {
    const status = stockStatus(product, settings.lowStockThreshold);
    const config = {
      out: { color: "error", label: t("description.outOfStock") },
      low: { color: "warning", label: t("description.lowStock") },
      ok: { color: "success", label: t("description.inStock") },
    }[status];
    return <Chip color={config.color} size="small" label={config.label} />;
  };

  const openEdit = (data) => {
    setEditData(data);
    setEditProductDialog(true);
  };

  const rowActions = (data) => (
    <>
      <Tooltip title={t("buttonText.addStock")}>
        <IconButton
          onClick={() => setStockInProduct(data)}
          color="primary"
          size="small"
        >
          <AddBoxOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <IconButton onClick={() => openEdit(data)} color="primary" size="small">
        <Edit fontSize="small" />
      </IconButton>
      <IconButton
        onClick={() => setDeleteProduct({ show: true, id: data?.id })}
        color="error"
        size="small"
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </>
  );

  const pageRows = visibleProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const emptyState = (
    <IMSTypography
      textAlign="center"
      color="natural.main"
      sx={{ py: 6, flex: { md: 1 } }}
    >
      {t("description.noDataFound")}
    </IMSTypography>
  );

  return (
    <FullHeightPage>
      <PageHeader
        title={t("menu.product")}
        subtitle={t("pageSubtitle.product")}
        actions={
          <IMSButton variant="contained" onClick={() => setShow(true)}>
            {t("buttonText.addProduct")}
          </IMSButton>
        }
      />
      <PageToolbar
        search={{
          value: searchText,
          onChange: (event) => setSearchText(event.target.value),
        }}
        filters={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={statusFilter}
            onChange={(event, next) => next && setStatusFilter(next)}
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="all">
              {t("menu.all")} ({counts.all})
            </ToggleButton>
            <ToggleButton value="low">
              {t("description.lowStock")} ({counts.low})
            </ToggleButton>
            <ToggleButton value="out">
              {t("description.outOfStock")} ({counts.out})
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {pageRows.length === 0 ? (
        emptyState
      ) : isMobile ? (
        <IMSStack>
          {pageRows.map((data) => (
            <IMSRecordCard
              key={data.id}
              title={data?.itemName}
              titleAdornment={statusChip(data)}
              subtitle={`${settings.currencySymbol}${formatMoney(
                data?.price,
              )} / ${baseUnitOf(data?.quantityCategory)}`}
              rows={[
                {
                  label: t("formLabel.stock"),
                  value: `${formatQuantity(
                    productStockInBase(data),
                  )} ${baseUnitOf(data?.quantityCategory)}`,
                  strong: true,
                },
                {
                  label: t("formLabel.costPrice"),
                  value: data?.costPrice
                    ? `${settings.currencySymbol}${formatMoney(data.costPrice)}`
                    : "-",
                },
              ]}
              actions={rowActions(data)}
            />
          ))}
        </IMSStack>
      ) : (
        <TableContainerStyle>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t("formLabel.productName")}</TableCell>
                <TableCell align="right">{t("description.price")}</TableCell>
                <TableCell align="right">{t("formLabel.costPrice")}</TableCell>
                <TableCell align="right">{t("formLabel.stock")}</TableCell>
                <TableCell>{t("formLabel.status")}</TableCell>
                <TableCell align="right">{t("description.action")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((data, i) => (
                <TableRow key={data.id} hover>
                  {/* Numbering continues across pages. */}
                  <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                  <TableCell>{data?.itemName}</TableCell>
                  <TableCell align="right">
                    {settings.currencySymbol}
                    {formatMoney(data?.price)}
                  </TableCell>
                  <TableCell align="right">
                    {data?.costPrice
                      ? `${settings.currencySymbol}${formatMoney(data.costPrice)}`
                      : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {formatQuantity(productStockInBase(data))}{" "}
                    <IMSTypography
                      color="natural.main"
                      variant="body2"
                      component="span"
                    >
                      {baseUnitOf(data?.quantityCategory)}
                    </IMSTypography>
                  </TableCell>
                  <TableCell>{statusChip(data)}</TableCell>
                  <TableCell align="right">{rowActions(data)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainerStyle>
      )}

      <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={visibleProducts.length}
        rowsPerPage={rowsPerPage}
        labelRowsPerPage={t("description.rowsPerPage")}
        page={page}
        onPageChange={(event, next) => setPage(next)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(+event.target.value);
          setPage(0);
        }}
        sx={{
          flexShrink: 0,
          "& .MuiTablePagination-toolbar": { flexWrap: "wrap", rowGap: 0.5 },
        }}
      />

      <IMSDialog
        title={t("formLabel.addNewProduct")}
        open={show}
        maxWidth="sm"
        handleClose={() => setShow(false)}
      >
        <AddProduct
          onSaved={() => {
            setShow(false);
            notifyDataChanged();
          }}
        />
      </IMSDialog>
      <IMSDialog
        title={t("buttonText.addStock")}
        open={Boolean(stockInProduct)}
        maxWidth="xs"
        handleClose={() => setStockInProduct(null)}
      >
        <StockIn
          product={stockInProduct}
          onSaved={() => setStockInProduct(null)}
        />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.editProduct")}
        open={editProductDialog}
        maxWidth="sm"
        handleClose={() => setEditProductDialog(false)}
      >
        <EditProduct
          editData={editData}
          onSaved={() => {
            setEditProductDialog(false);
            notifyDataChanged();
          }}
        />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.areYouSure")}
        open={Boolean(deleteProduct.show)}
        maxWidth="xs"
        handleClose={() => setDeleteProduct({ show: false })}
      >
        <IMSTypography mb={2} color="natural.main">
          {t("description.deleteNote")}
        </IMSTypography>
        <IMSStack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5}>
          <IMSButton
            variant="outlined"
            color="black"
            onClick={() => setDeleteProduct({ show: false })}
          >
            {t("buttonText.cancel")}
          </IMSButton>
          <IMSButton
            variant="contained"
            color="error"
            onClick={() => handleDeleteProduct(deleteProduct.id)}
          >
            {t("buttonText.delete")}
          </IMSButton>
        </IMSStack>
      </IMSDialog>
    </FullHeightPage>
  );
};

export default Product;
