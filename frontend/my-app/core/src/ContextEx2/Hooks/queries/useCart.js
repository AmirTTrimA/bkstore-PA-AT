import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BasketService from '../../Services/BasketService';
import { queryKeys } from './queryKeys';

/**
 * Hook to query current user's basket/cart.
 */
export const useCart = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.cart.current(),
    queryFn: async () => {
      const res = await BasketService.getBasket();
      return res.data;
    },
    ...options,
  });
};

/**
 * Hook to add item to cart with instant cache invalidation.
 */
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => BasketService.addItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() });
    },
  });
};

/**
 * Hook to update quantity of item in cart.
 */
export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => BasketService.setQuantity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() });
    },
  });
};

/**
 * Hook to remove item from cart.
 */
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => BasketService.removeItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() });
    },
  });
};

/**
 * Hook to validate promo / discount code.
 */
export const useValidateDiscount = () => {
  return useMutation({
    mutationFn: (code) => BasketService.validateDiscount(code),
  });
};
