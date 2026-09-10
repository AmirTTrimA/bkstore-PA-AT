import axios from "axios";

// ============================================
// Constants
// ============================================
const API_BASE_URL = process.env.REACT_APP_API_URL || "/api/v1";

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

// Public endpoints that should never trigger
// authenticated-token refresh behavior.
const PUBLIC_ENDPOINTS = [
  "/auth/register/",
  "/auth/login/",
  "/auth/login/otp/",
  "/auth/otp/request/",
  "/auth/password/reset/",
  "/auth/password/reset/confirm/",
  "/auth/refresh/",
];


// ============================================
// Helpers
// ============================================

const isPublicEndpoint = (url = "") => {
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};


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
// Attach access token only when appropriate
// ============================================

ApiClient.interceptors.request.use((config) => {
  // Always attach Accept-Language header for bilingual backend localization
  try {
    const lang = localStorage.getItem("language") || "en";
    config.headers["Accept-Language"] = lang;
  } catch {
    config.headers["Accept-Language"] = "en";
  }

  if (isPublicEndpoint(config.url)) {
    return config;
  }

  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// ============================================
// Response Interceptor
// Automatically refresh expired access tokens
// ============================================

let isRefreshing = false;
let refreshQueue = [];

ApiClient.interceptors.response.use(
  // ------------------------------------------
  // Success
  // ------------------------------------------

  (response) => response,


  // ------------------------------------------
  // Error
  // ------------------------------------------

  async (error) => {
    const originalRequest = error.config;

    // If Axios somehow gives us an error without
    // a request config, simply reject it.
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Public endpoints should never enter the
    // token-refresh flow.
    if (isPublicEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    // Only refresh on 401 responses.
    if (
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;


    // ------------------------------------------
    // Refresh already in progress
    // ------------------------------------------

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve,
          reject,
          request: originalRequest,
        });
      });
    }


    // ------------------------------------------
    // Start refresh
    // ------------------------------------------

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem(
        REFRESH_TOKEN_KEY
      );

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }


      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh/`,
        {
          refresh: refreshToken,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );


      const newAccessToken = response.data.access;

      const newRefreshToken =
        response.data.refresh || refreshToken;


      // Store new tokens.
      localStorage.setItem(
        TOKEN_KEY,
        newAccessToken
      );

      localStorage.setItem(
        REFRESH_TOKEN_KEY,
        newRefreshToken
      );


      // ------------------------------------------
      // Retry queued requests
      // ------------------------------------------

      refreshQueue.forEach(
        ({ resolve, reject, request }) => {
          request.headers.Authorization =
            `Bearer ${newAccessToken}`;

          ApiClient(request)
            .then(resolve)
            .catch(reject);
        }
      );

      refreshQueue = [];


      // ------------------------------------------
      // Retry original request
      // ------------------------------------------

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return ApiClient(originalRequest);

    } catch (refreshError) {

      // Reject all queued requests.
      refreshQueue.forEach(
        ({ reject }) => reject(refreshError)
      );

      refreshQueue = [];


      // Refresh failed.
      isRefreshing = false;


      // Only remove authentication state.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);


      // Redirect to login unless already there.
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