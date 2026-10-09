import {
  Card,
  Chip,
  Divider,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import ReactApexChart from "react-apexcharts";

import { apiResponse } from "../../api";
import IMSButton from "../../shared/IMSButton";
import IMSDatePicker from "../../shared/IMSDatePicker";
import IMSGrid from "../../shared/IMSGrid";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import {
  BACKUP_ENDPOINTS,
  downloadJson,
  lastBackupDate,
  runBackup,
} from "../../utils/backup";
import { formatMoney, formatQuantity } from "../../utils/billing";
import {
  dailySales,
  grossProfit,
  inventoryValue,
  lowStockProducts,
  ordersInMonth,
  ordersOnDay,
  paymentBreakdown,
  sumTotals,
  topProducts,
} from "../../utils/reporting";
import PageHeader from "../../shared/PageHeader";
import useSettings from "../../utils/useSettings";

const cardSx = {
  p: 2,
  borderRadius: 2,
  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
  height: "100%",
};

const StatCard = ({ label, value, color = "primary", caption }) => (
  <Card elevation={0} sx={cardSx}>
    <IMSTypography fontWeight={600}>{label}</IMSTypography>
    <IMSTypography variant="h5" color={color} fontWeight={600}>
      {value}
    </IMSTypography>
    {caption && (
      <IMSTypography variant="body2" color="natural.main">
        {caption}
      </IMSTypography>
    )}
  </Card>
);

const Reports = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const chartHeight = isMobile ? 260 : 350;
  const { settings } = useSettings();
  const currency = settings.currencySymbol;

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [month, setMonth] = useState(dayjs());
  const [downloadOption, setDownloadOption] = useState("all");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastBackup, setLastBackup] = useState(lastBackupDate());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orderRows, productRows] = await Promise.all([
        apiResponse("/orders", "GET"),
        apiResponse("/product", "GET"),
      ]);
      setOrders(orderRows.data || []);
      setProducts(productRows.data || []);
    } catch {
      toast.error(t("toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const monthOrders = useMemo(() => ordersInMonth(orders, month), [orders, month]);
  const days = useMemo(() => dailySales(monthOrders, month), [monthOrders, month]);
  const best = useMemo(() => topProducts(monthOrders, 5), [monthOrders]);
  const split = useMemo(() => paymentBreakdown(monthOrders), [monthOrders]);
  const profit = useMemo(
    () => grossProfit(monthOrders, products),
    [monthOrders, products]
  );
  const lowStock = useMemo(
    () => lowStockProducts(products, settings.lowStockThreshold),
    [products, settings.lowStockThreshold]
  );
  const stockValue = useMemo(() => inventoryValue(products), [products]);

  const totalSale = useMemo(() => sumTotals(orders), [orders]);
  const todaySale = useMemo(() => sumTotals(ordersOnDay(orders)), [orders]);
  const monthSale = useMemo(() => sumTotals(monthOrders), [monthOrders]);

  /**
   * One bar per day of the month. A smooth line on a time axis joined sale
   * days across the days between them, and zoomed to hours when the sales
   * were on consecutive days, so a day's bills could not be seen on their own.
   * Rebuilt on language change so the title follows.
   */
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        zoom: { enabled: false },
        toolbar: {
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
        },
      },
      colors: ["#007881"],
      plotOptions: { bar: { columnWidth: "65%", borderRadius: 2 } },
      dataLabels: { enabled: false },
      title: { text: t("description.salesByDate"), align: "left" },
      xaxis: {
        categories: days.map((point) => point.day),
        labels: {
          rotate: 0,
          // 31 numbers do not fit a phone: label the 1st and every 5th day.
          formatter: (day) =>
            !isMobile || Number(day) === 1 || Number(day) % 5 === 0
              ? String(day ?? "")
              : "",
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: { formatter: (value) => `${currency}${formatMoney(value)}` },
      },
      noData: { text: t("description.noDataFound") },
      tooltip: {
        x: {
          formatter: (value, { dataPointIndex } = {}) =>
            days[dataPointIndex]
              ? dayjs(days[dataPointIndex].date).format("DD MMM YYYY")
              : value,
        },
      },
    }),
    [t, currency, days, isMobile]
  );

  // A month without a bill gets no series, so the chart says "No data found".
  const chartSeries = useMemo(
    () =>
      monthOrders.length
        ? [
            {
              name: t("description.totalSales"),
              data: days.map((point) => point.total),
            },
          ]
        : [],
    [days, monthOrders.length, t]
  );

  const handleDownload = async () => {
    setBusy(true);
    try {
      if (downloadOption === "all") {
        const result = await runBackup({ force: true });
        setLastBackup(lastBackupDate());
        toast.success(
          t("toast.backupDownloadedCounts", {
            summary: Object.entries(result.counts || {})
              .map(([key, count]) => `${key}: ${count}`)
              .join(", "),
          })
        );
        return;
      }

      const endpoint = BACKUP_ENDPOINTS[downloadOption] || downloadOption;
      const response = await apiResponse(`/${endpoint}`, "GET");
      if (!response.success) throw new Error(endpoint);
      downloadJson(
        { [downloadOption]: response.data },
        `${dayjs().format("YYYY-MM-DD")}_${downloadOption}.json`
      );
      toast.success(t("toast.reportDownloaded"));
    } catch (error) {
      // The previous version passed the error as toast options, so the reason
      // was never shown.
      toast.error(t("toast.downloadFailed", { message: error.message || "" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("menu.reports")}
        subtitle={t("pageSubtitle.reports")}
        divider={false}
      />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      <IMSGrid container spacing={{ xs: 2, md: 3 }}>
        <IMSGrid item xs={12} md={8}>
          <Card elevation={0} sx={cardSx}>
            <IMSDatePicker
              views={["year", "month"]}
              formLabel={t("formLabel.selectMonth")}
              value={month}
              onChange={(value) => value && setMonth(value)}
            />
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="bar"
              height={chartHeight}
            />
          </Card>
        </IMSGrid>

        <IMSGrid item xs={12} md={4}>
          <IMSGrid container spacing={{ xs: 2, md: 3 }}>
            <IMSGrid item xs={12}>
              <Card elevation={0} sx={cardSx}>
                <IMSStack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 1.5, sm: 2 }}
                  alignItems={{ xs: "stretch", sm: "flex-end" }}
                >
                  <IMSSelect
                    onChange={(event) => setDownloadOption(event.target.value)}
                    value={downloadOption}
                    formLabel={t("formLabel.downloadReport")}
                    menu={[
                      { label: t("menu.all"), value: "all" },
                      { label: t("menu.product"), value: "product" },
                      { label: t("menu.customer"), value: "venders" },
                      { label: t("menu.orders"), value: "orders" },
                    ]}
                  />
                  <IMSButton
                    variant="contained"
                    sx={{ flex: "none" }}
                    onClick={handleDownload}
                    disabled={busy}
                    fullWidth={isMobile}
                  >
                    {t("buttonText.download")}
                  </IMSButton>
                </IMSStack>
                <IMSTypography variant="body2" color="natural.main">
                  {lastBackup
                    ? t("description.lastBackup", { date: lastBackup })
                    : t("description.noBackupYet")}
                </IMSTypography>
              </Card>
            </IMSGrid>

            <IMSGrid item xs={12}>
              <StatCard
                label={
                  month
                    ? t("description.monthSale", { month: month.format("MMMM YYYY") })
                    : t("description.currentMonthSale")
                }
                value={`${currency}${formatMoney(monthSale)}`}
                caption={t("description.billCount", { count: monthOrders.length })}
              />
            </IMSGrid>
            <IMSGrid item xs={6} md={6}>
              <StatCard
                label={t("description.totalSale")}
                value={`${currency}${formatMoney(totalSale)}`}
                color="orange.main"
              />
            </IMSGrid>
            <IMSGrid item xs={6} md={6}>
              <StatCard
                label={t("description.todaySale")}
                value={`${currency}${formatMoney(todaySale)}`}
                color="success.main"
              />
            </IMSGrid>
          </IMSGrid>
        </IMSGrid>

        <IMSGrid item xs={6} md={3}>
          <StatCard
            label={t("description.grossProfit")}
            value={`${currency}${formatMoney(profit.profit)}`}
            color="success.main"
            caption={t("description.profitCoverage", {
              coverage: formatMoney(profit.coverage),
            })}
          />
        </IMSGrid>
        <IMSGrid item xs={6} md={3}>
          <StatCard
            label={t("description.outstanding")}
            value={`${currency}${formatMoney(split.outstanding)}`}
            color="error.main"
            caption={t("description.pendingBills")}
          />
        </IMSGrid>
        <IMSGrid item xs={6} md={3}>
          <StatCard
            label={t("description.stockValueRetail")}
            value={`${currency}${formatMoney(stockValue.retail)}`}
          />
        </IMSGrid>
        <IMSGrid item xs={6} md={3}>
          <StatCard
            label={t("description.stockValueCost")}
            value={`${currency}${formatMoney(stockValue.cost)}`}
            color="natural.main"
          />
        </IMSGrid>

        <IMSGrid item xs={12} md={4}>
          <Card elevation={0} sx={cardSx}>
            <IMSTypography fontWeight={600} mb={1}>
              {t("description.paymentSplit")}
            </IMSTypography>
            <Divider sx={{ mb: 1 }} />
            {["Cash", "Online", "Pending"].map((mode) => (
              <IMSStack
                key={mode}
                direction="row"
                justifyContent="space-between"
                sx={{ py: 0.5 }}
              >
                <IMSTypography variant="body2">{mode}</IMSTypography>
                <IMSTypography variant="body2" fontWeight={600}>
                  {currency}
                  {formatMoney(split[mode])}
                </IMSTypography>
              </IMSStack>
            ))}
          </Card>
        </IMSGrid>

        <IMSGrid item xs={12} md={4}>
          <Card elevation={0} sx={cardSx}>
            <IMSTypography fontWeight={600} mb={1}>
              {t("description.topProducts")}
            </IMSTypography>
            <Divider sx={{ mb: 1 }} />
            {best.length === 0 ? (
              <IMSTypography variant="body2" color="natural.main">
                {t("description.noDataFound")}
              </IMSTypography>
            ) : (
              best.map((item) => (
                <IMSStack
                  key={item.id || item.itemName}
                  direction="row"
                  justifyContent="space-between"
                  sx={{ py: 0.5 }}
                >
                  <IMSTypography variant="body2">
                    {item.itemName}{" "}
                    <IMSTypography
                      component="span"
                      variant="body2"
                      color="natural.main"
                    >
                      ({formatQuantity(item.quantity)} {item.unit})
                    </IMSTypography>
                  </IMSTypography>
                  <IMSTypography variant="body2" fontWeight={600}>
                    {currency}
                    {formatMoney(item.revenue)}
                  </IMSTypography>
                </IMSStack>
              ))
            )}
          </Card>
        </IMSGrid>

        <IMSGrid item xs={12} md={4}>
          <Card elevation={0} sx={cardSx}>
            <IMSStack direction="row" alignItems="center" mb={1} gap={1}>
              <IMSTypography fontWeight={600}>
                {t("description.lowStockReport")}
              </IMSTypography>
              {lowStock.length > 0 && (
                <Chip size="small" color="warning" label={lowStock.length} />
              )}
            </IMSStack>
            <Divider sx={{ mb: 1 }} />
            {lowStock.length === 0 ? (
              <IMSTypography variant="body2" color="natural.main">
                {t("description.stockHealthy")}
              </IMSTypography>
            ) : (
              lowStock.slice(0, 8).map((item) => (
                <IMSStack
                  key={item.id}
                  direction="row"
                  justifyContent="space-between"
                  sx={{ py: 0.5 }}
                >
                  <IMSTypography variant="body2">{item.itemName}</IMSTypography>
                  <IMSTypography
                    variant="body2"
                    fontWeight={600}
                    color={item.stockInBase <= 0 ? "error" : "warning.main"}
                  >
                    {formatQuantity(item.stockInBase)} {item.unit}
                  </IMSTypography>
                </IMSStack>
              ))
            )}
          </Card>
        </IMSGrid>
      </IMSGrid>
    </>
  );
};

export default Reports;
