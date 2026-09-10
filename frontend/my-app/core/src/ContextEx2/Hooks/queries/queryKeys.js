/**
 * Standard Query Key Factory for React Query.
 * Provides hierarchical, type-safe query keys to enable deterministic cache invalidation.
 */
export const queryKeys = {
  books: {
    all: ['books'],
    list: (params = {}) => ['books', 'list', params],
    detail: (id) => ['books', 'detail', String(id)],
    new: (params = {}) => ['books', 'new', params],
    genres: () => ['books', 'genres'],
  },
  authors: {
    all: ['authors'],
    list: (params = {}) => ['authors', 'list', params],
    detail: (id) => ['authors', 'detail', String(id)],
  },
  publishers: {
    all: ['publishers'],
    publicList: (params = {}) => ['publishers', 'public', params],
    detail: (idOrSlug) => ['publishers', 'detail', String(idOrSlug)],
    mine: () => ['publishers', 'mine'],
    books: (id) => ['publishers', String(id), 'books'],
    proposals: (id, params = {}) => ['publishers', String(id), 'proposals', params],
  },
  recommendations: {
    all: ['recommendations'],
    forYou: (params = {}) => ['recommendations', 'forYou', params],
  },
  cart: {
    all: ['cart'],
    current: () => ['cart', 'current'],
  },
  wishlist: {
    all: ['wishlist'],
  },
  user: {
    profile: () => ['user', 'profile'],
    addresses: () => ['user', 'addresses'],
    orders: (params = {}) => ['user', 'orders', params],
  },
  wallet: {
    balance: () => ['wallet', 'balance'],
    transactions: (params = {}) => ['wallet', 'transactions', params],
  },
  proposals: {
    all: ['proposals'],
    list: (params = {}) => ['proposals', 'list', params],
    detail: (id) => ['proposals', 'detail', String(id)],
  },
  subscriptions: {
    all: ['subscriptions'],
    plans: () => ['subscriptions', 'plans'],
    mine: () => ['subscriptions', 'mine'],
  },
};

export default queryKeys;
