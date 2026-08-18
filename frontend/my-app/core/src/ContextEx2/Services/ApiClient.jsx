import axios from "axios";

// ============================================
// Constants
// ============================================

const API_BASE_URL = "http://localhost:8000/api/v1";

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

// ============================================
// Axios Instance
// ============================================

const ApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ============================================
// Request Interceptor
// Attach access token
// ============================================

ApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// Response Interceptor
// Automatically refresh expired access token
// ============================================

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  refreshQueue = [];
};

ApiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // No request config available
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const is401 = error.response?.status === 401;

    const isLoginRequest =
      originalRequest.url?.includes("/auth/login/");

    const isRefreshRequest =
      originalRequest.url?.includes("/auth/refresh/");

    // Only attempt refresh for expired authenticated requests
    if (
      !is401 ||
      originalRequest._retry ||
      isLoginRequest ||
      isRefreshRequest
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // No refresh token available
    if (!refreshToken) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // ============================================
    // Another request is already refreshing
    // ============================================

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(ApiClient(originalRequest));
          },
          reject,
        });
      });
    }

    // ============================================
    // Start refresh
    // ============================================

    isRefreshing = true;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh/`,
        {
          refresh: refreshToken,
        },
        {
          withCredentials: true,
        }
      );

      const newAccessToken = response.data.access;

      const newRefreshToken =
        response.data.refresh || refreshToken;

      localStorage.setItem(TOKEN_KEY, newAccessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return ApiClient(originalRequest);

    } catch (refreshError) {

      processQueue(refreshError);

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default ApiClient;