import ApiClient from "./ApiClient";

const BasketService = {

    getBasket: () =>
        ApiClient.get("/cart/items/"),

    addItem: (data) =>
        ApiClient.post("/cart/items/", data),


    setQuantity: (data) =>
        ApiClient.post("/cart/items/", data),


    removeItem: (data) =>
        ApiClient.delete("/cart/items/", {
            data
        }),


    checkout: (data) =>
        ApiClient.post("/cart/checkout/", data)

};

export default BasketService;