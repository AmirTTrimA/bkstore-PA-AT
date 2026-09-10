import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SubscriptionService from '../../Services/SubscriptionService';
import { queryKeys } from './queryKeys';

/**
 * Hook to fetch all available public subscription plans.
 */
export function useSubscriptionPlans(options = {}) {
  return useQuery({
    queryKey: queryKeys.subscriptions.plans(),
    queryFn: async () => {
      const res = await SubscriptionService.getPlans();
      const list = res.data?.results || res.data || [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    ...options,
  });
}

/**
 * Hook to fetch active and scheduled subscriptions for the current user.
 */
export function useMySubscriptions(options = {}) {
  return useQuery({
    queryKey: queryKeys.subscriptions.mine(),
    queryFn: async () => {
      const res = await SubscriptionService.getMySubscriptions();
      const list = res.data?.results || res.data || [];
      return Array.isArray(list) ? list : [];
    },
    ...options,
  });
}

/**
 * Mutation to purchase a subscription plan.
 */
export function usePurchaseSubscription(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => SubscriptionService.purchase(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      if (options.onSuccess) options.onSuccess(...args);
    },
    onError: (...args) => {
      if (options.onError) options.onError(...args);
    },
  });
}

/**
 * Mutation to upgrade an active subscription plan.
 */
export function useUpgradeSubscription(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => SubscriptionService.upgrade(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      if (options.onSuccess) options.onSuccess(...args);
    },
    onError: (...args) => {
      if (options.onError) options.onError(...args);
    },
  });
}

/**
 * Mutation to cancel an active or scheduled subscription.
 */
export function useCancelSubscription(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => SubscriptionService.cancel(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      if (options.onSuccess) options.onSuccess(...args);
    },
    onError: (...args) => {
      if (options.onError) options.onError(...args);
    },
  });
}
