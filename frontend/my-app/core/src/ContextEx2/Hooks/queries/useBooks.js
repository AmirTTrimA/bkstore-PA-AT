import { useQuery } from '@tanstack/react-query';
import BookService from '../../Services/BookService';
import { queryKeys } from './queryKeys';

/**
 * Hook to query paginated / filtered books catalog.
 */
export const useBooks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.books.list(params),
    queryFn: () => BookService.getBooks(params),
    ...options,
  });
};

/**
 * Hook to query a single book by ID or slug.
 */
export const useBookDetail = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.books.detail(id),
    queryFn: () => BookService.getBookById(id),
    enabled: Boolean(id),
    ...options,
  });
};

/**
 * Hook to query new arrivals / latest books.
 */
export const useNewBooks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.books.new(params),
    queryFn: () => BookService.getNewBooks(params),
    ...options,
  });
};

/**
 * Hook to query book genres taxonomy.
 */
export const useGenres = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.books.genres(),
    queryFn: () => BookService.getGenres(),
    staleTime: 30 * 60 * 1000, // Genres rarely change; cache for 30m
    ...options,
  });
};

/**
 * Hook to query authors list.
 */
export const useAuthors = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.authors.list(params),
    queryFn: () => BookService.getAuthors(params),
    ...options,
  });
};

/**
 * Hook to query single author by ID.
 */
export const useAuthorDetail = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.authors.detail(id),
    queryFn: () => BookService.getAuthorById(id),
    enabled: Boolean(id),
    ...options,
  });
};

/**
 * Hook to search books with search term.
 */
export const useSearchBooks = (term, params = {}, options = {}) => {
  return useQuery({
    queryKey: ['books', 'search', term, params],
    queryFn: () => BookService.searchBooks(term, params),
    enabled: Boolean(term && term.trim().length > 0),
    ...options,
  });
};
