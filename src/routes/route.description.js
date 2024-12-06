import React from "react";
import Dashboard from "../presentation/dashboard";
import Layout from "../Layout";
import Orders from "../presentation/orders";

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
        path: "/orders",
        element: <Orders />,
      },
    ],
  },
];

const routes = [...publicRoutes];

export default routes;
