import axios from 'axios'

const request = axios.create({
  timeout: 2000,
})

request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    // return Promise.reject(error);
    return error
  },
)

request.interceptors.response.use(
  (res) => {
    return res
  },
  (error) => {
    // return Promise.reject(error);
    return error
  },
)

declare module 'axios' {
  interface AxiosInstance {
    (config: AxiosRequestConfig): any
  }
}

export default request
