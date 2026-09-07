import ApiClient from "./ApiClient";


const SubscriptionService = {


    getPlans: async () => {

        return ApiClient.get(
            "/pricing/plans/"
        );

    },


    getMySubscriptions: async () => {

        return ApiClient.get(
            "/pricing/subscriptions/me/"
        );

    },


    purchase: async (payload) => {

        return ApiClient.post(
            "/pricing/subscriptions/purchase/",
            payload
        );

    },


    upgrade: async (payload) => {

        return ApiClient.post(
            "/pricing/subscriptions/upgrade/",
            payload
        );

    },


    cancel: async (payload = {}) => {

        return ApiClient.post(
            "/pricing/subscriptions/cancel/",
            payload
        );

    },


};


export default SubscriptionService;