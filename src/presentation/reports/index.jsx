import React, { useEffect, useState } from "react";
import IMSButton from "../../shared/IMSButton";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";
import ReactApexChart from "react-apexcharts";
import { ApiContainer } from "../../api";
import toast from "react-hot-toast";
import moment from "moment/moment";

const Reports = () => {
  const { apiResponse } = ApiContainer();
  const [options, setOptions] = useState("product");
  const [orders, setOrders] = useState([]);
  const [date, setDate] = useState([]);

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
            const response = await fetch(`http://localhost:8000/${endpoint}`);
            if (!response.ok) throw new Error(`${endpoint} failed`);
            const data = await response.json();
            return [key, data];
          }
        );

        const results = await Promise.all(fetchPromises);
        results.forEach(([key, data]) => {
          combinedData[key] = data;
        });
      } else {
        const response = await fetch(`http://localhost:8000/${options}`);
        if (!response.ok) throw new Error(`${options} failed`);
        const data = await response.json();
        combinedData = { [options]: data };
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
      console.error("Error downloading JSON:", error);
    }
  };

  const getOrder = async () => {
    try {
      const response = await apiResponse("/orders", "GET");
      if (response) {
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
      stroke: { curve: "straight" },
      title: { text: "Sales by Date", align: "left" },
      xaxis: { type: "datetime" },
      yaxis: { opposite: true },
      legend: { horizontalAlign: "left" },
    },
  });

  useEffect(() => {
    if (orders?.length) {
      const grouped = orders.reduce((acc, order) => {
        const date = moment(order.billingDate).format("YYYY-MM-DD");
        acc[date] = (acc[date] || 0) + Number(order.total);
        return acc;
      }, {});

      const labels = Object.keys(grouped);
      const data = Object.values(grouped);

      setChartData((prev) => ({
        ...prev,
        series: [{ name: "Total Sales", data }],
        options: { ...prev.options, labels },
      }));
    }
  }, [orders]);
  const handleChange = (e) => {
    setOptions(e.target.value);
  };

  console.log("orders", orders);

  return (
    <>
      <IMSStack direction="row" spacing={2}>
        <IMSSelect
          onChange={handleChange}
          defaultValue="product"
          menu={[
            { label: "All", value: "all" },
            { label: "Product", value: "product" },
            { label: "Venders", value: "venders" },
            { label: "Orders", value: "orders" },
          ]}
        />
        <IMSButton variant="contained" onClick={handleDownload}>
          Download
        </IMSButton>
      </IMSStack>
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="area"
        height={350}
      />
    </>
  );
};

export default Reports;
