import ApiClient from "./ApiClient";

const UserService = {

    // GET /auth/profile/
    getProfile: async () => {
        return ApiClient.get("/auth/profile/");
    },

};

export default UserService;