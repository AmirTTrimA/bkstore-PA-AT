import ApiClient from "./ApiClient";


const WalletService = {


    getWallet: async () => {

        return ApiClient.get(
            "/wallet/"
        );

    },


    getTransactions: async () => {

        return ApiClient.get(
            "/wallet/transactions/"
        );

    },


};


export default WalletService;