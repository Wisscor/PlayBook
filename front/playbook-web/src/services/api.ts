import { ApiError } from "@/types/api";
import axios, { AxiosError } from "axios";

const SUPPORTED_LOCALES = new Set(["en", "fr", "ar"]);
const DEFAULT_LOCALE = "en";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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

    if (typeof window !== "undefined" && status === 401) {
      const currentPath = window.location.pathname;

      const pathSegments = currentPath.split("/");
      const currentLocale = SUPPORTED_LOCALES.has(pathSegments[1])
        ? pathSegments[1]
        : DEFAULT_LOCALE;

      const isAuthPath = currentPath.includes("/auth");
      const isAuthApiRequest = url.includes("/auth");

      if (!isAuthPath && !isAuthApiRequest) {
        window.location.href = `/${currentLocale}/auth?mode=signin&sessionExpired=1`;
      }
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
