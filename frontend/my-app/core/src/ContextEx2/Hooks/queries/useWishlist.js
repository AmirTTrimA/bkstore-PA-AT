import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WishlistService from '../../Services/WishlistService';
import { queryKeys } from './queryKeys';

/**
 * Hook to query user's wishlist.
 */
export const useWishlist = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.wishlist.all,
    queryFn: async () => {
      const res = await WishlistService.getWishlist();
      return res.data;
    },
    ...options,
  });
};

/**
 * Hook to add book to wishlist.
 */
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookId) => WishlistService.addBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
};

/**
 * Hook to remove book from wishlist.
 */
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (wishlistId) => WishlistService.removeBook(wishlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
};
