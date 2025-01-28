import React from "react";
import Dashboard from "../presentation/dashboard";
import Layout from "../Layout";
import Orders from "../presentation/orders";
import Product from "../presentation/product";
import Customer from "../presentation/customer";
import Reports from "../presentation/reports";

const publicRoutes = [
  {
    element: <Layout />,
    path: "/",
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/product",
        element: <Product />,
      },
      {
        path: "/orders",
        element: <Orders />,
      },
      {
        path: "/reports",
        element: <Reports />,
      },
      {
        path: "/customer",
        element: <Customer />,
      },
    ],
  },
];

const routes = [...publicRoutes];

export default routes;
