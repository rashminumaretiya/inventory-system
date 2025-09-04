import React, { useEffect, useState } from "react";
import IMSButton from "../../shared/IMSButton";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";
import ReactApexChart from "react-apexcharts";
import { ApiContainer } from "../../api";
import toast from "react-hot-toast";
import moment from "moment/moment";
import { useTranslation } from "react-i18next";
import IMSGrid from "../../shared/IMSGrid";
import { Card, Paper } from "@mui/material";
import IMSDatePicker from "../../shared/IMSDatePicker";

const Reports = () => {
  const { t } = useTranslation();
  const { apiResponse } = ApiContainer();
  const [options, setOptions] = useState("product");
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const endpoints = {
    product: "product",
    venders: "venders",
    orders: "orders",
  };

  const handleDownload = async () => {
    try {
      let combinedData = {};

      if (options === "all") {
        const fetchPromises = Object.entries(endpoints).map(
          async ([key, endpoint]) => {
            const response = await apiResponse(`/${endpoint}`, "GET");
            if (response.status !== 200) throw new Error(`${endpoint} failed`);
            return [key, response.data];
          }
        );
        const results = await Promise.all(fetchPromises);
        results.forEach(([key, data]) => {
          combinedData[key] = data;
        });
      } else {
        const response = await apiResponse(`/${options}`, "GET");
        if (response.success === false) throw new Error(`${options} failed`);
        combinedData = { [options]: response.data };
      }

      const jsonStr = JSON.stringify(combinedData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${options === "all" ? "all_reports" : options}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Error downloading JSON:", error);
    }
  };

  const getOrder = async () => {
    try {
      const response = await apiResponse("/orders", "GET");
      if (response.success) {
        setOrders(response.data);
      }
    } catch {
      toast.error("Something went wrong while fetching orders");
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([getOrder()]);
    };
    fetchData();
  }, []);

  const [chartData, setChartData] = useState({
    series: [{ name: "Total Sales", data: [] }],
    options: {
      chart: {
        type: "area",
        height: 350,
        zoom: { enabled: true },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth" },
      title: { text: t("description.salesByDate"), align: "left" },
      xaxis: { type: "datetime" },
      yaxis: { opposite: true },
      legend: { horizontalAlign: "left" },
    },
  });

  useEffect(() => {
    if (orders?.length) {
      let filteredOrders = orders;

      if (startDate) {
        const selectedMonth = moment(
          startDate.toDate ? startDate.toDate() : startDate
        );
        filteredOrders = orders.filter((order) => {
          const orderDate = moment(order.billingDate);
          return (
            orderDate.month() === selectedMonth.month() &&
            orderDate.year() === selectedMonth.year()
          );
        });
      }

      const grouped = filteredOrders.reduce((acc, order) => {
        const date = moment(order.billingDate).format("YYYY-MM-DD");
        acc[date] = (acc[date] || 0) + Number(order.total);
        return acc;
      }, {});

      const labels = Object.keys(grouped).sort(
        (a, b) => new Date(a) - new Date(b)
      );

      const seriesData = labels.map((date) => [
        new Date(date).getTime(),
        Number(grouped[date].toFixed(2)),
      ]);

      setChartData((prev) => ({
        ...prev,
        series: [{ name: t("description.totalSales"), data: seriesData }],
      }));
    }
  }, [orders, startDate, t]);

  const handleChange = (e) => {
    setOptions(e.target.value);
  };

  return (
    <>
      <IMSStack direction="row" spacing={2} mb={4}>
        <IMSSelect
          onChange={handleChange}
          defaultValue="product"
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
        >
          {t("buttonText.download")}
        </IMSButton>
      </IMSStack>
      <IMSGrid container>
        <IMSGrid item md={6}>
          <Card elevation={5} sx={{ p: 2 }}>
            <IMSDatePicker
              views={["year", "month"]}
              formLabel="Select Month"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
            />
            <ReactApexChart
              options={chartData.options}
              series={chartData.series}
              type="area"
              height={350}
            />
          </Card>
        </IMSGrid>
      </IMSGrid>
    </>
  );
};

export default Reports;
