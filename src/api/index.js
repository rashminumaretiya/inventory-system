import axios from "axios";

export const ApiContainer = () => {
  const apiResponse = (URL, method, config, payload) =>
    new Promise((resolve, reject) => {
      const headers = {
        ...config,
      };
      axios(`http://localhost:8000${URL}`, {
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
