import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { messageApi } from "../utilities/antdStaticHolder";
import { logger } from "../utils/logger";


// Create Axios instance
const axiosIns = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
axiosIns.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Dev Logging
    if (import.meta.env.DEV) {
      logger.debug(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosIns.interceptors.response.use(
  (response) => {
    // Dev Logging
    if (import.meta.env.DEV) {
      logger.debug(`✅ API Response: ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Dev Logging
    if (import.meta.env.DEV) {
      logger.error(`❌ API Error: ${originalRequest?.url}`, error);
    }

    // Handle 401 Unauthorized (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosIns(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/refresh-token`,
          {},
          { withCredentials: true },
        );

        const newToken = data?.data?.accessToken;

        if (newToken) {
          localStorage.setItem("accessToken", newToken);
          axiosIns.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosIns(originalRequest);
        } else {
          throw new Error("No access token returned from refresh");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");

        // Use the static message instance if available, otherwise fallback to console
        if (messageApi) {
          messageApi.error("Session expired. Please login again.");
        }

        // Redirect to login (window.location is safest for non-React files)
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Global Error Handling for other errors (500, 403, etc.)
    if (error.response && error.response.status !== 401) {
      const errorMessage =
        (error.response?.data as any)?.message ||
        "An unexpected error occurred.";
      if (messageApi) {
        // Prevent spamming errors if multiple requests fail at once
        messageApi.open({
          type: "error",
          content: errorMessage,
          key: "api_error_message", // Unique key prevents duplicates
        });
      }
    } else if (error.code === "ERR_NETWORK") {
      if (messageApi) {
        messageApi.open({
          type: "error",
          content: "Network error. Please check your connection.",
          key: "network_error",
        });
      }
    }

    return Promise.reject(error);
  },
);

export default axiosIns;
