import ApiClient from "./ApiClient";


const BasketService = {


    getBasket: async () => {

        return ApiClient.get(
            "/cart/items/"
        );

    },


    addItem: async (data) => {

        return ApiClient.post(
            "/cart/items/",
            data
        );

    },


    removeItem: async (item) => {

        return ApiClient.delete(
            "/cart/items/",
            {
                data: {
                    book_id: item.book_id,
                    format_id: item.format_id
                }
            }
        );

    },


    updateQuantity: async (id, quantity) => {

        return ApiClient.patch(
            `/cart/items/${id}/`,
            {
                quantity
            }
        );

    }


};


export default BasketService;