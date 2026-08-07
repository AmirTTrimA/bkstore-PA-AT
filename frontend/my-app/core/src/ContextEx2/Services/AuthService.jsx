// ✅
import ApiClient from "./ApiClient";

const AuthService = {
  // POST /auth/register
  register: async (data) => {
    return ApiClient.post("/auth/register/", data);
  },

  // POST /auth/login
  login: async (data) => {
    return ApiClient.post("/auth/login/", data);
  },
};

export default AuthService;
