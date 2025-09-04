import axios from "axios";

export const ApiContainer = () => {
  const apiResponse = (URL, method, config, payload) =>
    new Promise((resolve, reject) => {
      let headers = {
        "Content-Type": "application/json",
        ...config,
      };
      axios(`https://json-hosting-f86n.onrender.com${URL}`, {
        method: method,
        headers,
        data: payload,
      })
        .then((res) => {
          return resolve({ ...res, success: true });
        })
        .catch((err) => {
          return reject({ ...err, success: false });
        });
    });
  return { apiResponse };
};
