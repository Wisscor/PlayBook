import { ApiError } from "@/types/api";
import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (
    error: AxiosError<{
      message?: string;
      detail?: unknown;
      error?: { code?: string };
    }>,
  ) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const url = error.config?.url ?? "";

    const isLoginRequest = url.includes("/auth");

    if (status === 401 && !isLoginRequest) {
      window.location.href = "/en/login";
    }

    const apiError: ApiError = {
      status,
      errorCode: data?.error?.code,
      message: data?.message ?? error.message,
      detail: data?.detail,
      data,
    };

    return Promise.reject(apiError);
  },
);
