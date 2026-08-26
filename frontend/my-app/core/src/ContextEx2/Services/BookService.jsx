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

  getNewBooks: async () => {
    const response = await ApiClient.get(
      "/books/new/"
    );

    return response.data;
  },

  searchBooks: async (term) => {
    const response = await ApiClient.get(
      `/books/?search=${encodeURIComponent(term)}`
    );

    return response.data;
  },

  getGenres: async () => {
    const response = await ApiClient.get(
      "/books/genres/"
    );

    return response.data;
  },
};

export default BookService;