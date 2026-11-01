import axios, { AxiosError } from "axios";
import type { ApiResponse } from "../types";
import i18n from "../i18n";
import { useAuthStore } from "../store/authStore";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("min-roamer.token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.match(/\/auth\/(login|register)$/)
    ) {
      useAuthStore.getState().clearSession();
    }
    const contentType = String(error.response?.headers["content-type"] || "");
    const proxyFailure =
      error.response?.status === 500 &&
      (contentType.includes("text/plain") ||
        typeof error.response.data === "string");
    const errorKeys: Record<string, string> = {
      "Email or password is incorrect": "invalidCredentials",
      "Username already exists": "usernameTaken",
      "Email already exists": "emailTaken",
      "Password must be 72 UTF-8 bytes or fewer": "passwordBytes",
    };
    const serverMessage = error.response?.data?.message;
    const message =
      error.code === "ECONNABORTED"
        ? i18n.t("requestTimeout")
        : proxyFailure || error.code === "ERR_NETWORK"
          ? i18n.t("backendUnavailable")
          : (serverMessage && errorKeys[serverMessage]
              ? i18n.t(errorKeys[serverMessage])
              : serverMessage) ||
            error.message ||
            "Request failed";
    return Promise.reject(
      Object.assign(new Error(message), { status: error.response?.status }),
    );
  },
);

export async function unwrap<T>(
  request: Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
  const response = await request;
  if (response.data.code !== 0) throw new Error(response.data.message);
  return response.data.data;
}
