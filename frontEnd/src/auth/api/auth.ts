import { api } from "../../lib/axios/api";
import type { SignupData, LoginData } from "../types";

export async function signupRequest(signupData: SignupData) {
  return api.post("/auth/signup", signupData);
}

export async function loginRequest(loginData: LoginData) {
  return api.post("/auth/login", loginData);
}

export async function logoutRequest() {
  return api.post("/auth/logout");
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}
