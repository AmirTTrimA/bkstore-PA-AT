import ApiClient from "./ApiClient";

const BasketService = {

    getBasket: () =>
        ApiClient.get("/cart/items/"),

    addItem: (data) =>
        ApiClient.post("/cart/items/", data),


    setQuantity: (data) =>
        ApiClient.put("/cart/items/", { ...data, override: true }),

    removeItem: (data) =>
        ApiClient.delete("/cart/items/", {
            data
        }),

    checkout: (data) =>
        ApiClient.post("/cart/checkout/", data),

    validateDiscount: (code) =>
        ApiClient.post("/pricing/validate/", { code }),
};

export default BasketService;