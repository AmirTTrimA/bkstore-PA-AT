import ApiClient from "./ApiClient";

const BookService = {
  getBooks: async (params = {}) => {
    const response = await ApiClient.get("/books/", { params });

    // Handle DRF pagination
    return response.data.results || response.data;
  },

  getBookById: async (id) => {
    const response = await ApiClient.get(`/books/${id}/`);
    return response.data;
  },
  getNewBooks: async () => {
    const res = await ApiClient.get('/books/new/')
    return res.data.results || res.data || []
  },

  searchBooks: async (term) => {
    const res = await ApiClient.get(`/books/?search=${encodeURIComponent(term)}`)
    return res.data.results || []
  },
};

export default BookService;