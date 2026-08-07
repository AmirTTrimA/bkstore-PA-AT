// ✅
import axios from "axios";

// ============================================
//    Constants
// ============================================
const API_BASE_URL = "http://localhost:8000/api/v1";
const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";


// ============================================
//    Axios Instance
// ============================================
const ApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  
});

// ============================================
//    Request Interceptor - Attach Token
// ============================================

ApiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
// ============================================
//    Response Interceptor - Auto Refresh Token
// ============================================
  let isRefreshing = false;
  let refreshQueue = [];
  
  ApiClient.interceptors.response.use(
    // success - passthrough
    (response) => response,
  
    // error - handle token expire
    async (error) => {
      const originalRequest = error.config;

      // skip refresh for login and refresh endpoints
      const isLoginRequest = originalRequest.url.includes("/auth/login");
      const isRefreshRequest = originalRequest.url.includes("/auth/token/refresh/");
  
      // Only handle 401 errors (token expired)
      if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isLoginRequest &&
          !isRefreshRequest
          ) {
        originalRequest._retry = true;
  
        // Prevent multiple refresh calls
        if (!isRefreshing) {
          isRefreshing = true;
  
          try {

            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
             // Request new access token
            const res = await axios.post(
              "http://localhost:8000/api/v1/auth/token/refresh/",
              { refresh:refreshToken },
              { withCredentials: true }
            );
  
            // Store new tokens
            localStorage.setItem(TOKEN_KEY, res.data.access);
            localStorage.setItem(REFRESH_TOKEN_KEY, res.data?.refresh || refreshToken);
  
            // Retry queued requests
            refreshQueue.forEach((cb) => cb(res.data.access));
            refreshQueue = [];
            isRefreshing = false;
  
            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

            return ApiClient(originalRequest);
          } catch (err) {

            // Refresh failed - clear tokens and redirect to login
            isRefreshing = false;
            refreshQueue = [];
            localStorage.clear();
            // Only redirect if not already on login page
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
            return Promise.reject(err);
          }
        }
  
        // Queue other requests while refreshing
        return new Promise((resolve) => {
          refreshQueue.push((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(ApiClient(originalRequest));
          });
        });
      }
      // For all other errors, just reject
      return Promise.reject(error);
    }
  );
  
  export default ApiClient;


