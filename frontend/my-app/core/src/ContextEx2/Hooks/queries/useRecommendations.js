import { useQuery } from '@tanstack/react-query';
import RecommendationService from '../../Services/RecommendationService';
import { queryKeys } from './queryKeys';

/**
 * Hook to query personalized / curated "For You" recommendations.
 */
export const useForYouRecommendations = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.recommendations.forYou(params),
    queryFn: () => RecommendationService.getForYouRecommendations(params),
    ...options,
  });
};

/**
 * Hook to query similar books for a specific book id.
 */
export const useSimilarBooks = (bookId, limit = 6, options = {}) => {
  return useQuery({
    queryKey: ['recommendations', 'similar', String(bookId), limit],
    queryFn: () => RecommendationService.getSimilarBooks(bookId, limit),
    enabled: Boolean(bookId),
    ...options,
  });
};
