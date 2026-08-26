import ApiClient from "./ApiClient";


const PaymentService = {

    chargeWallet: async (amount) => {

        return ApiClient.post(
            "/payments/wallet/charge/",
            {
                amount: Number(amount),
            }
        );

    },

};


export default PaymentService;