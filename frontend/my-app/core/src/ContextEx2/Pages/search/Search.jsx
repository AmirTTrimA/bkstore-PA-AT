import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import Footer from "../../Components/Footer";
import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";

import BookService from "../../Services/BookService";
import PublisherService from "../../Services/PublisherService";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Search.css";

// ============================================
// Constants
// ============================================

const MIN_PRICE = 0;
const MAX_PRICE = 5000000;
const PRICE_STEP = 50000;

const SORT_OPTIONS = [
  { id: "latest", label: "Latest" },
  { id: "cheap", label: "Price: Low to High" },
  { id: "expensive", label: "Price: High to Low" },
  { id: "title", label: "Title A-Z" },
];

const FORMAT_OPTIONS = [
  { id: "", label: "All Formats" },
  { id: "PHYSICAL", label: "Physical Book" },
  { id: "DIGITAL", label: "Digital (PDF)" },
  { id: "AUDIO", label: "Audiobook" },
];

const EMPTY_COVER = "https://placehold.co/400x600?text=No+Cover";

export const search_results = [];

function mapBookToSearchCard(book) {
  return {
    searchId: String(book.id),
    name: book.title,
    author_name: book.author_name || "Unknown Author",
    author_id: book.author_id,
    category: book.genre || "General",
    price: book.price || "0",
    original_price: book.original_price || book.price || "0",
    discount_percent: book.discount_percent || 0,
    has_discount: Boolean(book.has_discount),
    since: book.created_at ? new Date(book.created_at).getFullYear() : "",
    imgUrl: book.cover_image_url || EMPTY_COVER,
    is_digital: Boolean(book.is_digital),
    is_audio: Boolean(book.is_audio),
  };
}

export default function Search() {
  const navigate = useNavigate();
  const { searchTerm } = useParams();
  const [searchParams] = useSearchParams();

  // Initial values from URL
  const initialQuery =
    searchTerm && searchTerm !== "all"
      ? searchTerm
      : searchParams.get("q") || searchParams.get("search") || "";
  const initialGenre = searchParams.get("genre") || "";
  const initialFormat = searchParams.get("format") || "";

  // Search input state
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  // Metadata dropdowns
  const [genresList, setGenresList] = useState([]);
  const [publishersList, setPublishersList] = useState([]);
  const [authorsList, setAuthorsList] = useState([]);

  // Results & Pagination
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Sorting
  const [selectedSort, setSelectedSort] = useState("latest");
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // Filters
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filterFormat, setFilterFormat] = useState(initialFormat);
  const [filterGenre, setFilterGenre] = useState(initialGenre);
  const [filterPublisher, setFilterPublisher] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [minValue, setMinValue] = useState(MIN_PRICE);
  const [maxValue, setMaxValue] = useState(MAX_PRICE);

  // Refs
  const loadMoreRef = useRef(null);

  // ============================================
  // Load Filter Metadata (Genres, Publishers, Authors)
  // ============================================
  useEffect(() => {
    let isMounted = true;
    const loadMetadata = async () => {
      try {
        const [genresData, pubsData, authorsData] = await Promise.allSettled([
          BookService.getGenres(),
          PublisherService.getPublicPublishers(),
          BookService.getAuthors({ page_size: 50 }),
        ]);

        if (!isMounted) return;

        if (genresData.status === "fulfilled") {
          const list = genresData.value?.results || genresData.value || [];
          setGenresList(Array.isArray(list) ? list : []);
        }

        if (pubsData.status === "fulfilled") {
          const list = pubsData.value?.results || pubsData.value || [];
          setPublishersList(Array.isArray(list) ? list : []);
        }

        if (authorsData.status === "fulfilled") {
          const list = authorsData.value?.results || authorsData.value || [];
          setAuthorsList(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Failed loading search filters metadata:", err);
      }
    };

    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================
  // Fetch Books from Backend
  // ============================================
  const fetchBooks = useCallback(
    async (pageNumber, replace = false) => {
      const params = {
        page: pageNumber,
      };

      if (activeQuery && activeQuery.trim()) {
        params.search = activeQuery.trim();
      }

      if (filterGenre) {
        params.genre = filterGenre;
      }

      if (filterFormat) {
        params.format = filterFormat;
      }

      if (filterPublisher) {
        params.publisher = filterPublisher;
      }

      if (filterAuthor) {
        params.author = filterAuthor;
      }

      const response = await BookService.getBooks(params);
      const rawBooks = response.results || [];
      const mapped = rawBooks.map(mapBookToSearchCard);

      if (replace) {
        setBooks(mapped);
      } else {
        setBooks((prev) => [...prev, ...mapped]);
      }

      setPage(pageNumber);
      setHasMore(Boolean(response.next));
      setTotalCount(response.count || mapped.length);
    },
    [activeQuery, filterGenre, filterFormat, filterPublisher, filterAuthor]
  );

  // Trigger initial or filter change fetch
  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      setIsLoading(true);
      setIsLoadingMore(false);
      setPage(1);
      setHasMore(false);

      try {
        await fetchBooks(1, true);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load search results:", err);
          setBooks([]);
          setHasMore(false);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [fetchBooks]);

  // ============================================
  // Load More (Pagination)
  // ============================================
  const loadMoreBooks = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      await fetchBooks(page + 1, false);
    } catch (err) {
      console.error("Failed to load more books:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoading, isLoadingMore, page, fetchBooks]);

  // Infinite scroll observer
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreBooks();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMoreBooks]);

  // ============================================
  // Client-Side Price & Sort Filtering
  // ============================================
  const displayedBooks = useMemo(() => {
    return books
      .filter((item) => {
        const priceNum = Number(item.price);
        if (!isNaN(priceNum)) {
          if (priceNum < minValue || priceNum > maxValue) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        if (selectedSort === "cheap") return priceA - priceB;
        if (selectedSort === "expensive") return priceB - priceA;
        if (selectedSort === "title") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [books, minValue, maxValue, selectedSort]);

  // ============================================
  // Handlers
  // ============================================
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveQuery(searchInput.trim());
    if (searchInput.trim()) {
      navigate(`/search/${encodeURIComponent(searchInput.trim())}`, { replace: true });
    } else {
      navigate("/search", { replace: true });
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveQuery("");
    navigate("/search", { replace: true });
  };

  const handleClearAllFilters = () => {
    setSearchInput("");
    setActiveQuery("");
    setFilterFormat("");
    setFilterGenre("");
    setFilterPublisher("");
    setFilterAuthor("");
    setMinValue(MIN_PRICE);
    setMaxValue(MAX_PRICE);
    setSelectedSort("latest");
    navigate("/search", { replace: true });
  };

  const handleMinChange = (e) => {
    const val = Math.min(Number(e.target.value), maxValue - PRICE_STEP);
    setMinValue(val);
  };

  const handleMaxChange = (e) => {
    const val = Math.max(Number(e.target.value), minValue + PRICE_STEP);
    setMaxValue(val);
  };

  const hasActiveFilters = Boolean(
    activeQuery ||
      filterFormat ||
      filterGenre ||
      filterPublisher ||
      filterAuthor ||
      minValue > MIN_PRICE ||
      maxValue < MAX_PRICE
  );

  return (
    <div className="search-page-wrapper">
      <div className="search-nav-res">
        <SimpleNav />
      </div>
      <div className="search-nav-full">
        <Navbar />
      </div>

      <main className="search-full-container">
        {/* TOP SEARCH BAR & ACTIONS */}
        <section className="search-top-header">
          <div className="search-top-row">
            <button
              className="search-back-btn"
              onClick={() => navigate(-1)}
              title="Go Back"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back</span>
            </button>

            <form className="search-input-form" onSubmit={handleSearchSubmit}>
              <i className="fas fa-search search-input-icon"></i>
              <input
                type="text"
                className="search-input-field"
                placeholder="Search catalog by title, author, description, or ISBN..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </form>

            <div className="search-mobile-actions">
              <button
                className="mobile-sort-trigger-btn"
                onClick={() => setIsSortSheetOpen(true)}
              >
                <i className="fas fa-sort"></i> Sort
              </button>
              <button
                className="mobile-filter-trigger-btn"
                onClick={() => setIsFilterSheetOpen(true)}
              >
                <i className="fas fa-filter"></i> Filter
                {hasActiveFilters && <span className="active-dot"></span>}
              </button>
            </div>
          </div>

          {/* ACTIVE FILTER CHIPS */}
          {hasActiveFilters && (
            <div className="active-filter-chips-bar">
              <span className="chips-title">Active Filters:</span>
              {activeQuery && (
                <span className="filter-chip">
                  Keyword: "{activeQuery}"
                  <button onClick={handleClearSearch}>✕</button>
                </span>
              )}
              {filterFormat && (
                <span className="filter-chip">
                  Format: {filterFormat}
                  <button onClick={() => setFilterFormat("")}>✕</button>
                </span>
              )}
              {filterGenre && (
                <span className="filter-chip">
                  Genre: {filterGenre}
                  <button onClick={() => setFilterGenre("")}>✕</button>
                </span>
              )}
              {filterPublisher && (
                <span className="filter-chip">
                  Publisher
                  <button onClick={() => setFilterPublisher("")}>✕</button>
                </span>
              )}
              {filterAuthor && (
                <span className="filter-chip">
                  Author
                  <button onClick={() => setFilterAuthor("")}>✕</button>
                </span>
              )}
              {(minValue > MIN_PRICE || maxValue < MAX_PRICE) && (
                <span className="filter-chip">
                  {formatPrice(minValue)} - {formatPrice(maxValue)}
                  <button
                    onClick={() => {
                      setMinValue(MIN_PRICE);
                      setMaxValue(MAX_PRICE);
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
              <button className="clear-all-chips-btn" onClick={handleClearAllFilters}>
                Clear All
              </button>
            </div>
          )}
        </section>

        {/* MAIN 2-COLUMN LAYOUT */}
        <div className="main-search-container">
          {/* LEFT SIDEBAR: DESKTOP FILTERS */}
          <aside className="side-card-filter">
            <div className="filter-sidebar-header">
              <h3>
                <i className="fas fa-sliders-h" style={{ marginRight: 8 }}></i>
                Filters
              </h3>
              {hasActiveFilters && (
                <button
                  className="filter-reset-text-btn"
                  onClick={handleClearAllFilters}
                >
                  Reset
                </button>
              )}
            </div>

            <div className="filter-sidebar-content">
              {/* Format Filter */}
              <div className="filter-widget">
                <label className="filter-widget-label">Book Format</label>
                <div className="format-pills-selector">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`format-pill-btn ${filterFormat === opt.id ? "active" : ""}`}
                      onClick={() => setFilterFormat(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre / Category Filter */}
              <div className="filter-widget">
                <label className="filter-widget-label">Genre</label>
                <select
                  className="filter-select-input"
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                >
                  <option value="">All Genres</option>
                  {genresList.map((genre) => (
                    <option key={genre.id || genre.name || genre} value={genre.name || genre}>
                      {genre.name || genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Publisher Filter */}
              <div className="filter-widget">
                <label className="filter-widget-label">Publisher</label>
                <select
                  className="filter-select-input"
                  value={filterPublisher}
                  onChange={(e) => setFilterPublisher(e.target.value)}
                >
                  <option value="">All Publishers</option>
                  {publishersList.map((pub) => (
                    <option key={pub.id} value={pub.id}>
                      {pub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Author Filter */}
              <div className="filter-widget">
                <label className="filter-widget-label">Author</label>
                <select
                  className="filter-select-input"
                  value={filterAuthor}
                  onChange={(e) => setFilterAuthor(e.target.value)}
                >
                  <option value="">All Authors</option>
                  {authorsList.map((auth) => (
                    <option key={auth.id} value={auth.id}>
                      {auth.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="filter-widget">
                <label className="filter-widget-label">Price Range</label>
                <div className="price-inputs-range">
                  <div className="price-range-slider-box">
                    <input
                      type="range"
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      step={PRICE_STEP}
                      value={minValue}
                      onChange={handleMinChange}
                      className="slider-min"
                    />
                    <input
                      type="range"
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      step={PRICE_STEP}
                      value={maxValue}
                      onChange={handleMaxChange}
                      className="slider-max"
                    />
                  </div>
                  <div className="price-range-labels">
                    <span>{formatPrice(minValue)}</span>
                    <span>{formatPrice(maxValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: RESULTS & SORT */}
          <section className="main-search">
            {/* Sort & Count Row */}
            <div className="search-results-meta-bar">
              <div className="results-count-text">
                {isLoading ? (
                  <span>Loading books...</span>
                ) : (
                  <span>
                    Showing <strong>{displayedBooks.length}</strong> of {totalCount} books
                  </span>
                )}
              </div>

              <div className="desktop-sort-bar">
                <span className="sort-bar-label">Sort by:</span>
                <div className="sort-chips">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      className={`sort-chip-btn ${selectedSort === opt.id ? "active" : ""}`}
                      onClick={() => setSelectedSort(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Book Cards Grid */}
            {isLoading ? (
              <div className="search-status-box">
                <div className="search-spinner"></div>
                <p>Searching bookstore catalog...</p>
              </div>
            ) : displayedBooks.length === 0 ? (
              <div className="search-empty-state">
                <i className="fas fa-book-open empty-icon"></i>
                <h3>No Books Found</h3>
                <p>
                  No titles match your active search and filter criteria. Try adjusting or clearing your filters.
                </p>
                {hasActiveFilters && (
                  <button
                    className="reset-filters-cta-btn"
                    onClick={handleClearAllFilters}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="search-cards-grid">
                {displayedBooks.map((item) => (
                  <Link
                    key={item.searchId}
                    to={`/book/${item.searchId}`}
                    className="search-catalog-card"
                  >
                    <div className="catalog-card-image-wrap">
                      {item.has_discount && item.discount_percent > 0 && (
                        <span className="catalog-card-discount-badge">
                          -{item.discount_percent}%
                        </span>
                      )}
                      <img
                        src={item.imgUrl}
                        alt={item.name}
                        loading="lazy"
                        className="catalog-card-cover"
                      />
                      <div className="card-format-icons">
                        {item.is_digital && <span title="Digital PDF available">📱</span>}
                        {item.is_audio && <span title="Audiobook available">🎧</span>}
                      </div>
                    </div>

                    <div className="catalog-card-details">
                      <span className="catalog-card-genre">{item.category}</span>
                      <h4 className="catalog-card-title">{item.name}</h4>
                      <p className="catalog-card-author">{item.author_name}</p>

                      <div className="catalog-card-price-row">
                        {item.has_discount && item.discount_percent > 0 ? (
                          <div className="price-with-discount">
                            <span className="price-orig">
                              {formatPrice(item.original_price)}
                            </span>
                            <span className="price-final discounted">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="price-final">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Sentinel for Infinite Scroll */}
            {hasMore && <div ref={loadMoreRef} className="search-scroll-sentinel" />}

            {isLoadingMore && (
              <div className="search-loading-more-box">
                <div className="search-spinner-sm"></div>
                <span>Loading more books...</span>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      {/* MOBILE SORT BOTTOM SHEET */}
      <div
        className={`bottom-sheet-overlay ${isSortSheetOpen ? "active" : ""}`}
        onClick={() => setIsSortSheetOpen(false)}
      >
        <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="bottom-sheet-handle" />
          <div className="bottom-sheet-title">Sort By</div>
          <div className="bottom-sheet-body">
            {SORT_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className={`sort-option-item ${selectedSort === opt.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedSort(opt.id);
                  setIsSortSheetOpen(false);
                }}
              >
                <span className="sort-label">{opt.label}</span>
                {selectedSort === opt.id && <span className="check-icon">✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE FILTER BOTTOM SHEET */}
      <div
        className={`bottom-sheet-overlay ${isFilterSheetOpen ? "active" : ""}`}
        onClick={() => setIsFilterSheetOpen(false)}
      >
        <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="bottom-sheet-handle" />
          <div className="bottom-sheet-title">Filter Catalog</div>
          <div className="bottom-sheet-body">
            {/* Format */}
            <div className="filter-group">
              <label className="filter-group-label">Format</label>
              <select
                className="filter-select-input"
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Genre */}
            <div className="filter-group">
              <label className="filter-group-label">Genre</label>
              <select
                className="filter-select-input"
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
              >
                <option value="">All Genres</option>
                {genresList.map((genre) => (
                  <option key={genre.id || genre.name || genre} value={genre.name || genre}>
                    {genre.name || genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Publisher */}
            <div className="filter-group">
              <label className="filter-group-label">Publisher</label>
              <select
                className="filter-select-input"
                value={filterPublisher}
                onChange={(e) => setFilterPublisher(e.target.value)}
              >
                <option value="">All Publishers</option>
                {publishersList.map((pub) => (
                  <option key={pub.id} value={pub.id}>
                    {pub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label className="filter-group-label">Price Range</label>
              <div className="price-range-labels">
                <span>{formatPrice(minValue)}</span>
                <span>{formatPrice(maxValue)}</span>
              </div>
              <div className="price-range-slider-box">
                <input
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={PRICE_STEP}
                  value={minValue}
                  onChange={handleMinChange}
                />
                <input
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={PRICE_STEP}
                  value={maxValue}
                  onChange={handleMaxChange}
                />
              </div>
            </div>
          </div>

          <div className="bottom-sheet-actions">
            <button
              className="bottom-sheet-reset-btn"
              onClick={() => {
                handleClearAllFilters();
                setIsFilterSheetOpen(false);
              }}
            >
              Reset All
            </button>
            <button
              className="bottom-sheet-apply-btn"
              onClick={() => setIsFilterSheetOpen(false)}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}