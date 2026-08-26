import ApiClient from "./ApiClient";


const OrderService = {


    // ============================================
    // Order History
    // ============================================

    getOrders: async () => {

        return ApiClient.get(
            "/cart/orders/"
        );

    },


    // ============================================
    // Single Order
    // ============================================

    getOrderById: async (id) => {

        return ApiClient.get(
            `/cart/orders/${id}/`
        );

    },


};


export default OrderService;