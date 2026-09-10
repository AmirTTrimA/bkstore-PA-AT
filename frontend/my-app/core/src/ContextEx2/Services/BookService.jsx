import ApiClient from "./ApiClient";

const BookService = {
  getBooks: async (params = {}) => {
    const response = await ApiClient.get(
      "/books/",
      { params }
    );

    return response.data;
  },

  getBookById: async (id) => {
    const response = await ApiClient.get(
      `/books/${id}/`
    );

    return response.data;
  },

  getNewBooks: async (params = {}) => {
    const response = await ApiClient.get(
      "/books/new/",
      { params }
    );

    return response.data;
  },

  searchBooks: async (term, params = {}) => {
    const response = await ApiClient.get(
      "/books/",
      { params: { search: term, ...params } }
    );

    return response.data;
  },

  getGenres: async () => {
    const response = await ApiClient.get(
      "/books/genres/"
    );

    return Array.isArray(response.data.results)
      ? response.data.results
      : [];
  },

  getAuthors: async (params = {}) => {
    const response = await ApiClient.get(
      "/authors/",
      { params }
    );

    return response.data;
  },

  getAuthorById: async (id) => {
    const response = await ApiClient.get(
      `/authors/${id}/`
    );

    return response.data;
  },
};

export default BookService;