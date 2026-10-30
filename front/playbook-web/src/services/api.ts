import { ApiError } from "@/types/api";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  (error: AxiosError<{ detail?: unknown; message?: unknown }>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    let message = "Something went wrong. Please try again.";

    if (!error.response) {
      message = "Unable to connect to the server.";
    } else {
      const responseMessage = data?.detail ?? data?.message;
      if (typeof responseMessage === "string") {
        message = responseMessage;
      } else if (error.message) {
        message = error.message;
      }
    }

    const apiError: ApiError = {
      message,
      status: status ?? null,
      details: data?.detail ?? data?.message,
    };

    return Promise.reject(apiError);
  },
);
