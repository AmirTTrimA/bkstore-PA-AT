import ApiClient from "./ApiClient";

const PublisherService = {
  /**
   * Fetches all active public publishers for the storefront.
   */
  getPublicPublishers: async () => {
    try {
      const response = await ApiClient.get("/publishing/public/publishers/");
      return Array.isArray(response.data) ? response.data : (response.data?.results || []);
    } catch (err) {
      console.error("Failed to load public publishers:", err);
      return [];
    }
  },

  /**
   * Fetches public detail for a publisher by ID or slug.
   */
  getPublicPublisher: async (idOrSlug) => {
    const response = await ApiClient.get(`/publishing/public/publishers/${idOrSlug}/`);
    return response.data;
  },

  /**
   * Fetches the publishers that the authenticated user belongs to.
   */
  getMyPublishers: async () => {
    const response = await ApiClient.get("/publishing/publishers/");
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },

  /**
   * Fetches the books associated with a specific publisher.
   */
  getPublisherBooks: async (publisherId) => {
    const response = await ApiClient.get(`/publishing/publishers/${publisherId}/books/`);
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },

  /**
   * Lists proposals submitted by a specific publisher.
   */
  getPublisherProposals: async (publisherId, params = {}) => {
    const response = await ApiClient.get(
      `/publishing/publishers/${publisherId}/proposals/`,
      { params }
    );
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },

  /**
   * Retrieves detail for a specific proposal.
   */
  getProposalDetail: async (proposalId) => {
    const response = await ApiClient.get(`/publishing/proposals/${proposalId}/`);
    return response.data;
  },

  /**
   * Withdraws a pending proposal.
   */
  withdrawProposal: async (proposalId, reason = "") => {
    const response = await ApiClient.post(
      `/publishing/proposals/${proposalId}/withdraw/`,
      { reason }
    );
    return response.data;
  },

  /**
   * Submits a new book creation proposal.
   */
  createBookProposal: async (data) => {
    const response = await ApiClient.post(
      "/publishing/proposals/book-create/",
      data
    );
    return response.data;
  },

  /**
   * Submits a book update proposal.
   */
  updateBookProposal: async (data) => {
    const response = await ApiClient.post(
      "/publishing/proposals/book-update/",
      data
    );
    return response.data;
  },

  /**
   * Submits a price change proposal for a book.
   */
  changePriceProposal: async (data) => {
    const response = await ApiClient.post(
      "/publishing/proposals/price-change/",
      data
    );
    return response.data;
  },

  /**
   * Submits a book deletion proposal.
   */
  deleteBookProposal: async (data) => {
    const response = await ApiClient.post(
      "/publishing/proposals/book-delete/",
      data
    );
    return response.data;
  },

  /**
   * Submits a new author creation proposal.
   */
  createAuthorProposal: async (data) => {
    const response = await ApiClient.post(
      "/publishing/proposals/author-create/",
      data
    );
    return response.data;
  },

  /**
   * Submits an author update proposal.
   */
  updateAuthorProposal: async (data) => {
    const response = await ApiClient.post(
      "/publishing/proposals/author-update/",
      data
    );
    return response.data;
  },

  /**
   * Fetches all authors from the catalog.
   */
  getAuthors: async () => {
    const response = await ApiClient.get("/authors/?all=true");
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },
};

export default PublisherService;
