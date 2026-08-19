import ApiClient from "./ApiClient";

const UserService = {

    // GET /auth/profile/
    getProfile: async () => {
        return ApiClient.get("/auth/profile/");
    },

    // PATCH /auth/profile/update/
    updateProfile: async (data) => {
        return ApiClient.patch(
            "/auth/profile/update/",
            data
        );
    },

    // POST /auth/password/change/
    changePassword: async (data) => {
        return ApiClient.post(
            "/auth/password/change/",
            data
        );
    },

};

export default UserService;