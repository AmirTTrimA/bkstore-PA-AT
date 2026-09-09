import ApiClient from "./ApiClient";

const RecommendationService = {
  /**
   * Fetch similar books for a specific book id.
   * @param {number|string} bookId
   * @param {number} [limit=6]
   * @returns {Promise<Object>} Object containing target_book and recommendations array
   */
  getSimilarBooks: async (bookId, limit = 6) => {
    const response = await ApiClient.get(`/recommendations/similar/${bookId}/`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Fetch personalized recommendations for the authenticated user,
   * or curated cross-genre showcase for anonymous visitors.
   * @param {Object} [params={}] { limit, language }
   * @returns {Promise<Object>} Object containing personalized boolean and recommendations array
   */
  getForYouRecommendations: async (params = {}) => {
    const response = await ApiClient.get("/recommendations/for-you/", {
      params,
    });
    return response.data;
  },
};

export default RecommendationService;
