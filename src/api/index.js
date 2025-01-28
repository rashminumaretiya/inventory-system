import axios from "axios";

export const ApiContainer = () => {
  const apiResponse = (URL, method, config, payload) =>
    new Promise((resolve, reject) => {
      const headers = {
        ...config,
      };
      axios(`https://h3rcpp2q-8000.inc1.devtunnels.ms${URL}`, {
        method: method,
        headers,
        data: payload,
      })
        .then((res) => {
          return resolve(res);
        })
        .catch((err) => {
          return reject(err);
        });
    });
  return { apiResponse };
};
