import ApiClient from "./ApiClient";

const AuthService = {

  // ============================================
  // Registration
  // ============================================

  register: async (data) => {
    return ApiClient.post("/auth/register/", data);
  },

  // ============================================
  // Username / Password Login
  // ============================================

  login: async (data) => {
    return ApiClient.post("/auth/login/", data);
  },

  // ============================================
  // OTP Login
  // ============================================

  loginWithOtp: async (data) => {
    return ApiClient.post("/auth/login/otp/", data);
  },

  // ============================================
  // OTP Request
  // ============================================

  requestOtp: async (data) => {
    return ApiClient.post("/auth/otp/request/", data);
  },

  // ============================================
  // OTP Verification
  // ============================================

  verifyOtp: async (data) => {
    return ApiClient.post("/auth/otp/verify/", data);
  },

  // ============================================
  // Logout
  // ============================================

  logout: async (refreshToken) => {
    return ApiClient.post("/auth/logout/", {
      refresh: refreshToken,
    });
  },

  // ============================================
  // Password Reset
  // ============================================

  requestPasswordReset: async (data) => {
    return ApiClient.post("/auth/password/reset/", data);
  },

  confirmPasswordReset: async (data) => {
    return ApiClient.post(
      "/auth/password/reset/confirm/",
      data
    );
  },

  // ============================================
  // Token Refresh
  // ============================================

  refresh: async (refreshToken) => {
    return ApiClient.post("/auth/refresh/", {
      refresh: refreshToken,
    });
  },

};

export default AuthService;