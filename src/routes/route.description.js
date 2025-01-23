import React from "react";
import Dashboard from "../presentation/dashboard";
import Layout from "../Layout";
import Orders from "../presentation/orders";
import Product from "../presentation/product";

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
    ],
  },
];

const routes = [...publicRoutes];

export default routes;
