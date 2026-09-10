import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UserService from '../../Services/UserService';
import AddressService from '../../Services/AddressService';
import OrderService from '../../Services/OrderService';
import WalletService from '../../Services/WalletService';
import { queryKeys } from './queryKeys';

/**
 * Hook to query authenticated user's profile.
 */
export const useProfile = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const res = await UserService.getProfile();
      return res.data;
    },
    ...options,
  });
};

/**
 * Hook to mutate profile data.
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => UserService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
};

/**
 * Hook to query user's saved addresses.
 */
export const useAddresses = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.user.addresses(),
    queryFn: async () => {
      const res = await AddressService.getAddresses();
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
    ...options,
  });
};

/**
 * Hook to create a new address.
 */
export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => AddressService.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.addresses() });
    },
  });
};

/**
 * Hook to delete an address.
 */
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => AddressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.addresses() });
    },
  });
};

/**
 * Hook to query user's order history.
 */
export const useOrders = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.user.orders(params),
    queryFn: async () => {
      const res = await OrderService.getOrders(params);
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
    ...options,
  });
};

/**
 * Hook to query user's wallet balance.
 */
export const useWallet = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.wallet.balance(),
    queryFn: async () => {
      const res = await WalletService.getWallet();
      return res.data;
    },
    ...options,
  });
};

/**
 * Hook to query user's wallet transactions.
 */
export const useWalletTransactions = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: async () => {
      const res = await WalletService.getTransactions(params);
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
    ...options,
  });
};
