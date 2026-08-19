import ApiClient from "./ApiClient";


const WishlistService = {


    // ============================================
    // Get Wishlist
    // ============================================

    getWishlist: async () => {

        return ApiClient.get(
            "/cart/wishlist/"
        );

    },


    // ============================================
    // Add Book
    // ============================================

    addBook: async (bookId) => {

        return ApiClient.post(
            "/cart/wishlist/",
            {
                book_id: bookId
            }
        );

    },


    // ============================================
    // Remove Book
    // ============================================

    removeBook: async (wishlistId) => {

        return ApiClient.delete(
            `/cart/wishlist/${wishlistId}/`
        );

    }

};


export default WishlistService;