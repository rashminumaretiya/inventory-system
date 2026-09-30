import axios from "axios";

/**
 * Base URL comes from the environment so the bundled json-server
 * (`npm run server`) can be used during development:
 *   REACT_APP_API_BASE_URL=http://localhost:8000
 */
export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  "https://json-hosting-f86n.onrender.com"
).replace(/\/$/, "");

/**
 * Stable across renders on purpose. The previous version built a new function
 * inside ApiContainer() on every call, so any effect that listed `apiResponse`
 * as a dependency re-ran forever.
 */
export const apiResponse = (URL, method, config, payload) =>
  new Promise((resolve, reject) => {
    const headers = {
      "Content-Type": "application/json",
      ...config,
    };
    axios(`${API_BASE_URL}${URL}`, {
      method,
      headers,
      data: payload,
    })
      .then((res) => resolve({ ...res, success: true }))
      .catch((err) => reject({ ...err, success: false }));
  });

export const ApiContainer = () => ({ apiResponse });
