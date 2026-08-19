import ApiClient from "./ApiClient";

const ContentService = {

    // ============================================
    // User Content Library
    // ============================================

    getLicenses: () =>
        ApiClient.get("/content/licenses/"),

};

export default ContentService;