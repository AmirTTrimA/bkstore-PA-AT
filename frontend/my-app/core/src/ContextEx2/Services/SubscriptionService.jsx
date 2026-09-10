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

    purchaseSubscription: async (planId, autoRenew = false) => {
        return ApiClient.post(
            "/pricing/subscriptions/purchase/",
            {
                plan_id: planId,
                auto_renew: autoRenew,
            }
        );
    },

    upgrade: async (payload) => {
        return ApiClient.post(
            "/pricing/subscriptions/upgrade/",
            payload
        );
    },

    upgradeSubscription: async (planId) => {
        return ApiClient.post(
            "/pricing/subscriptions/upgrade/",
            {
                plan_id: planId,
            }
        );
    },

    cancel: async (payload = {}) => {
        return ApiClient.post(
            "/pricing/subscriptions/cancel/",
            payload
        );
    },

    cancelSubscription: async (subscriptionId, refund = true) => {
        return ApiClient.post(
            "/pricing/subscriptions/cancel/",
            {
                subscription_id: subscriptionId,
                refund: refund,
            }
        );
    },
};

export default SubscriptionService;