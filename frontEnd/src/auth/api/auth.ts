import { api } from "../../lib/axios/api";
import axios, { AxiosError } from "axios";
import type { SignupData, LoginData } from "../types/authTypes";
import { ApiError } from "../../lib/axios/apiError";

export async function signupRequest(signupData: SignupData) {
  return api.post("/auth/signup", signupData);
}

export async function loginRequest(loginData: LoginData) {
  try {
    return await api.post("/auth/login", loginData);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error.response?.data);
      console.log(error.response?.status);
    }
    throw error;
  }
}

export async function logoutRequest() {
  return api.post("/auth/logout");
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

async function refresh() {
  await api.post("/auth/refresh").finally(() => (refreshPromise = null));
}

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    const originalRequest = err.config;

    if (!originalRequest) throw err;

    if (err.response?.status !== 401) throw err;

    if (originalRequest.url === "/auth/refresh") throw err;

    if (originalRequest._retry) throw err;

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refresh();
    }

    await refreshPromise;
    return api(originalRequest);
  },
);

api.interceptors.response.use(
  res => res,
  err => {
    if (axios.isAxiosError(err)) {
      throw new ApiError(err.response?.data?.message ?? "something went wrong", err.response?.status);
    }
    throw err;
  },
);
