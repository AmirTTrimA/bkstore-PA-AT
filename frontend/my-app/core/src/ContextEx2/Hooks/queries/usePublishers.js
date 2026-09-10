import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PublisherService from '../../Services/PublisherService';
import { queryKeys } from './queryKeys';

/**
 * Hook to query public publishers for storefront.
 */
export const usePublicPublishers = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.publishers.publicList(),
    queryFn: () => PublisherService.getPublicPublishers(),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook to query single public publisher detail.
 */
export const usePublicPublisherDetail = (idOrSlug, options = {}) => {
  return useQuery({
    queryKey: queryKeys.publishers.detail(idOrSlug),
    queryFn: () => PublisherService.getPublicPublisher(idOrSlug),
    enabled: Boolean(idOrSlug),
    ...options,
  });
};

/**
 * Hook to query publishers that authenticated user manages.
 */
export const useMyPublishers = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.publishers.mine(),
    queryFn: () => PublisherService.getMyPublishers(),
    ...options,
  });
};

/**
 * Hook to query publisher's catalog of books.
 */
export const usePublisherBooks = (publisherId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.publishers.books(publisherId),
    queryFn: () => PublisherService.getPublisherBooks(publisherId),
    enabled: Boolean(publisherId),
    ...options,
  });
};

/**
 * Hook to query publisher proposals.
 */
export const usePublisherProposals = (publisherId, params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.publishers.proposals(publisherId, params),
    queryFn: () => PublisherService.getPublisherProposals(publisherId, params),
    enabled: Boolean(publisherId),
    ...options,
  });
};

/**
 * Hook to submit book creation proposal.
 */
export const useSubmitBookCreateProposal = (publisherId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => PublisherService.submitBookCreateProposal(publisherId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publishers.proposals(publisherId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
    },
  });
};

/**
 * Hook to submit book update proposal.
 */
export const useSubmitBookUpdateProposal = (publisherId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => PublisherService.submitBookUpdateProposal(publisherId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publishers.proposals(publisherId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
    },
  });
};
