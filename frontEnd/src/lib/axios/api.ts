import axios from "axios";

export const api = axios.create({ baseURL: "http://localhost:3000", withCredentials: true });

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}
