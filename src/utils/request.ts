import axios from "axios";

let request = axios.create({
  timeout: 2000,
});

request.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    // return Promise.reject(error);
    return error;
  }
);

request.interceptors.response.use(
  function (res) {
    return res;
  },
  function (error) {
    // return Promise.reject(error);
    return error;
  }
);

declare module "axios" {
  interface AxiosInstance {
    (config: AxiosRequestConfig): any;
  }
}

export default request;
