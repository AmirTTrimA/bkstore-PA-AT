import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Footer from "../../Components/Footer";
import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";

import BookService from "../../Services/BookService";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Search.css";


// ============================================
// Constants
// ============================================

const MIN_PRICE = 0;
const MAX_PRICE = 5000000;
const PRICE_STEP = 50000;

const SORT_OPTIONS = [
  { id: "cheap", label: "Cheap" },
  { id: "expensive", label: "Expensive" },
  { id: "latest", label: "Latest" },
  { id: "topsell", label: "Top Sell" },
  { id: "most visited", label: "Most Visited" },
];

const FORMAT_OPTIONS = [
  "physical",
  "pdf",
];

const EMPTY_COVER =
  "https://placehold.co/400x600?text=No+Image";


export const search_results = [
// { searchId: "1", name: "harry-potter", category: 'novel', price: "60", since: "2020", imgUrl: pic9 },
// { searchId: "2", name: "sara life", category: 'trip-geo', price: "33", since: "1990", imgUrl: "https://di-uploads-pod11.dealerinspire.com/stevelanderschryslerdodgejeepram/uploads/2017/07/DG018_036CLul7gbtg3iqneobqm1lk3178ng4__mid.jpg" },
// { searchId: "3", name: "KING naser", category: 'history', price: "50", since: "2021", imgUrl: "https://cdn.motor1.com/images/mgl/ZXN9K/s3/ford-mustang-shelby-gt500.jpg" },
// { searchId: "4", name: "new way", category: 'trip-geo', price: "30", since: "2021", imgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn&s" },
// { searchId: "5", name: "citizen art", category: 'psychology', price: "29", since: "2019", imgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn&s" },
// { searchId: "6", name: "Quran", category: 'religious', price: "15.09", since: "2002", imgUrl: "https://www.usnews.com/object/image/00000195-1985-dae4-a7d5-d9c784cf0000/p90541178-highres-rolls-royce-arcadia-1.jpg?update-time=1739889995584&size=responsive640" },
// { searchId: "7", name: "AI king", category: 'tech', price: "16", since: "2004", imgUrl: "https://www.mad4wheels.com/img/free-car-images/mobile/22103/jas-motorsport-tensei-by-pininfarina-2026-thumb.jpg" },
// { searchId: "8", name: "IOT", category: 'tech', price: "17", since: "2007", imgUrl: "https://image-cdn.beforward.jp/large/202603/12708974/CA622571_1d16adb9.jpg" },
// { searchId: "9", name: "police limitations", category: 'science-education', price: "80", since: "2018", imgUrl: "https://www.bmw-m.com/content/dam/bmw/marketBMW_M/www_bmw-m_com/topics/magazine-article-pool/2021/e46-gtr-street/bmw-m3-gtr-street-gallery-01.jpg" },
// { searchId: "10", name: "society engineering", category: 'psychology', price: "65", since: "2006", imgUrl: "https://sureshdrives.com/blog/wp-content/uploads/2024/12/c200-car-w204.jpg" },
// { searchId: "11", name: "money honey", category: 'financial', price: "65", since: "2006", imgUrl: "https://sureshdrives.com/blog/wp-content/uploads/2024/12/c200-car-w204.jpg" },
// { searchId: "12", name: "humanization people", category: 'psychology', price: "31", since: "2000", imgUrl: "https://sureshdrives.com/blog/wp-content/uploads/2024/12/c200-car-w204.jpg" },
// { searchId: "13", name: "utility personality", category: 'psychology', price: "22", since: "1989", imgUrl: "https://sureshdrives.com/blog/wp-content/uploads/2024/12/c200-car-w204.jpg" },

]


// ============================================
// Helpers
// ============================================

function mapBookToSearchCard(book) {
  return {
    searchId: String(book.id),
    name: book.title,
    category: book.genre || "general",
    price: book.price || "0",
    since: book.created_at
      ? new Date(book.created_at).getFullYear()
      : "",
    imgUrl: book.cover_image_url || EMPTY_COVER,
  };
}


// ============================================
// Main
// ============================================

export default function Search() {

  const { searchTerm } = useParams();

  // --- Refs ---

  const containerRef = useRef(null);
  const loadMoreRef = useRef(null);


  // --- Results ---

  const [searchValue, setSearchValue] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);


  // --- Sorting ---

  const [selectedSort, setSelectedSort] = useState("");
  const [isSortSheetOpen, setIsSortSheetOpen] =
    useState(false);


  // --- Filters ---

  const [isFilterSheetOpen, setIsFilterSheetOpen] =
    useState(false);

  const [filterFormat, setFilterFormat] = useState("");
  const [filterPublisher, setFilterPublisher] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");


  // --- Price Range ---

  const [minValue, setMinValue] =
    useState(MIN_PRICE);

  const [maxValue, setMaxValue] =
    useState(MAX_PRICE);


  // ============================================
  // Load Page
  // ============================================

  const loadPage = useCallback(
    async (pageNumber, replace = false) => {

      let response;

      if (searchTerm === "new") {

        response = await BookService.getNewBooks({
          page: pageNumber,
        });

      } else if (searchTerm) {

        response = await BookService.searchBooks(
          searchTerm,
          {
            page: pageNumber,
          }
        );

      } else {

        response = await BookService.getBooks({
          page: pageNumber,
        });

      }


      const books = response.results || [];

      const mappedBooks = books.map(
        mapBookToSearchCard
      );


      if (replace) {

        setSearchValue(mappedBooks);

      } else {

        setSearchValue((previous) => [
          ...previous,
          ...mappedBooks,
        ]);

      }


      setPage(pageNumber);

      setHasMore(Boolean(response.next));

    },
    [searchTerm]
  );


  // ============================================
  // Initial Load
  // ============================================

  useEffect(() => {

    let cancelled = false;


    const loadInitialPage = async () => {

      setIsLoading(true);
      setIsLoadingMore(false);
      setPage(1);
      setHasMore(false);
      setSearchValue([]);


      try {

        await loadPage(1, true);

      } catch (err) {

        if (!cancelled) {

          console.error(
            "Failed to load search results:",
            err
          );

          setSearchValue([]);
          setHasMore(false);

        }

      } finally {

        if (!cancelled) {
          setIsLoading(false);
        }

      }

    };


    loadInitialPage();


    return () => {
      cancelled = true;
    };

  }, [loadPage]);


  // ============================================
  // Load More
  // ============================================

  const loadMoreBooks = useCallback(async () => {

    if (
      !hasMore ||
      isLoading ||
      isLoadingMore
    ) {
      return;
    }


    setIsLoadingMore(true);


    try {

      await loadPage(page + 1, false);

    } catch (err) {

      console.error(
        "Failed to load more books:",
        err
      );

    } finally {

      setIsLoadingMore(false);

    }

  }, [
    hasMore,
    isLoading,
    isLoadingMore,
    page,
    loadPage,
  ]);


  // ============================================
  // Infinite Scroll
  // ============================================

  useEffect(() => {

    const target = loadMoreRef.current;

    if (!target || !hasMore) {
      return;
    }


    const observer = new IntersectionObserver(
      (entries) => {

        if (entries[0]?.isIntersecting) {
          loadMoreBooks();
        }

      },
      {
        threshold: 0.1,
      }
    );


    observer.observe(target);


    return () => {
      observer.disconnect();
    };

  }, [
    hasMore,
    loadMoreBooks,
  ]);


  // ============================================
  // Filter Container Scroll Styling
  // ============================================

  useEffect(() => {

    const container = containerRef.current;

    if (!container) {
      return;
    }


    let timeout;


    const handleScroll = () => {

      container.classList.add("scrolling");

      clearTimeout(timeout);

      timeout = setTimeout(() => {

        container.classList.remove("scrolling");

      }, 500);

    };


    container.addEventListener(
      "scroll",
      handleScroll
    );


    return () => {

      container.removeEventListener(
        "scroll",
        handleScroll
      );

      clearTimeout(timeout);

    };

  }, []);


  // ============================================
  // Handlers
  // ============================================

  const handleSortSelect = (sortId) => {

    setSelectedSort(sortId);
    setIsSortSheetOpen(false);

  };


  const handleFilterApply = () => {

    setIsFilterSheetOpen(false);

    // Backend filtering can be connected here.
    // Keeping the UI behavior unchanged for now.

  };


  // ============================================
  // Price Handlers
  // ============================================

  const handleMinChange = (event) => {

    const value = Math.min(
      Number(event.target.value),
      maxValue - PRICE_STEP
    );

    setMinValue(value);

  };


  const handleMaxChange = (event) => {

    const value = Math.max(
      Number(event.target.value),
      minValue + PRICE_STEP
    );

    setMaxValue(value);

  };


  // ============================================
  // Price Range Calculations
  // ============================================

  const percent1 =
    ((minValue - MIN_PRICE) /
      (MAX_PRICE - MIN_PRICE)) * 83;

  const percent2 =
    ((maxValue - MIN_PRICE) /
      (MAX_PRICE - MIN_PRICE)) * 88;


  const percent3 =
    ((minValue - MIN_PRICE) /
      (MAX_PRICE - MIN_PRICE)) * 95;

  const percent4 =
    ((maxValue - MIN_PRICE) /
      (MAX_PRICE - MIN_PRICE)) * 95;


  const thumbRadius = 15;

  const progressLeft = percent1;

  const progressWidth =
    percent2 - percent1;


  const thumbRadius2 = 12;

  const progressLeft2 = percent3;

  const progressWidth2 =
    percent4 - percent3;


  // ============================================
  // Filter & Sort
  // ============================================

  const displayedBooks = useMemo(() => {
    return searchValue
      .filter((item) => {
        const priceNum = Number(item.price);
        if (!isNaN(priceNum)) {
          if (priceNum < minValue || priceNum > maxValue) return false;
        }
        if (
          filterCategory &&
          !item.category?.toLowerCase().includes(filterCategory.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        if (selectedSort === "cheap") return priceA - priceB;
        if (selectedSort === "expensive") return priceB - priceA;
        if (selectedSort === "latest") return (b.since || 0) - (a.since || 0);
        return 0;
      });
  }, [searchValue, minValue, maxValue, filterCategory, selectedSort]);


  // ============================================
  // Loading
  // ============================================

  if (isLoading) {

    return (
      <div>
        Loading ...
      </div>
    );

  }


  // ============================================
  // Render
  // ============================================

  return (

    <div>

      {/* Navigation */}

      <div className="search-nav-res">
        <SimpleNav />
      </div>


      <div className="search-full-container">

        <div className="search-nav-full">
          <Navbar />
        </div>


        {/* Main Content */}

        <div className="main-search-container">

          <div className="main-search">

            {/* Sort Row */}

            <div className="sort-row">

              <p>
                sort by :
              </p>

              <ul>

                {SORT_OPTIONS.map((option) => (

                  <li
                    key={option.id}
                    onClick={() =>
                      handleSortSelect(option.id)
                    }
                    style={{
                      color:
                        selectedSort === option.id
                          ? "#309700"
                          : "",
                    }}
                  >
                    {option.label}
                  </li>

                ))}

              </ul>

            </div>


            {/* Mobile Sort / Filter */}

            <div className="mobile-sort-filter-row">

              <button
                className="mobile-sort-btn"
                onClick={() =>
                  setIsSortSheetOpen(true)
                }
              >
                <i className="fas fa-sort"></i>
                {" "}Sort
              </button>


              <button
                className="mobile-filter-btn"
                onClick={() =>
                  setIsFilterSheetOpen(true)
                }
              >
                <i className="fas fa-filter"></i>
                {" "}Filter
              </button>

            </div>


            {/* Results */}

            <div className="search-cards-row">

              {displayedBooks.length === 0 ? (

                <p className="search-result-empty-error">
                  No Result found
                </p>

              ) : (

                displayedBooks.map((item) => (

                  <Link
                    key={item.searchId}
                    to={`/book/${item.searchId}`}
                    className="search-cards"
                  >

                    <div className="search-card-pic">

                      <img
                        src={item.imgUrl}
                        alt={item.name}
                        loading="lazy"
                      />

                    </div>


                    <div className="search-card-info">

                      <span className="search-card-field-name">
                        {item.name}
                      </span>

                      <span className="search-card-field-price">
                        {formatPrice(item.price)}
                      </span>

                    </div>

                  </Link>

                ))

              )}

            </div>


            {/* Infinite Scroll Sentinel */}

            {hasMore && (

              <div
                ref={loadMoreRef}
                style={{
                  height: "40px",
                  width: "100%",
                }}
              />

            )}


            {isLoadingMore && (

              <p
                style={{
                  textAlign: "center",
                }}
              >
                Loading more books...
              </p>

            )}

          </div>


          {/* Desktop Filters */}

          <div className="side-card-filter">

            <div className="search-filter-container">

              <label className="search-filters-title">
                Filters
              </label>


              <div
                ref={containerRef}
                className="search-filter-small-container"
              >

                {/* Format */}

                <label className="filters-label">
                  Format:
                </label>

                <select
                  value={filterFormat}
                  onChange={(event) =>
                    setFilterFormat(
                      event.target.value
                    )
                  }
                  name="book-format"
                  id="book-format"
                >

                  <option
                    value=""
                    disabled
                    hidden
                  >
                    choose one
                  </option>

                  {FORMAT_OPTIONS.map((option) => (

                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>

                  ))}

                </select>


                {/* Price */}

                <label className="filters-label">
                  Price:
                </label>


                <div className="price-range-container">

                  <div className="price-range-slider-container">

                    <div
                      className="price-range-progress"
                      style={{
                        left:
                          `calc(${progressLeft}% + ${thumbRadius}px)`,
                        width:
                          `calc(${progressWidth}% - ${thumbRadius * 0.72}px)`,
                        transform:
                          "translateY(-85%)",
                      }}
                    />


                    <input
                      type="range"
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      step={PRICE_STEP}
                      value={minValue}
                      onChange={handleMinChange}
                      className="price-range-slider slider-left"
                    />


                    <input
                      type="range"
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      step={PRICE_STEP}
                      value={maxValue}
                      onChange={handleMaxChange}
                      className="price-range-slider slider-right"
                    />

                  </div>


                  <div className="price-range-display">

                    <span>
                      {formatPrice(minValue)}
                    </span>

                    <span>
                      {formatPrice(maxValue)}
                    </span>

                  </div>

                </div>


                {/* Publisher */}

                <label className="filters-label">
                  Publisher:
                </label>

                <input
                  type="text"
                  value={filterPublisher}
                  onChange={(event) =>
                    setFilterPublisher(
                      event.target.value
                    )
                  }
                />


                {/* Category */}

                <label className="filters-label">
                  Category:
                </label>

                <input
                  type="text"
                  value={filterCategory}
                  onChange={(event) =>
                    setFilterCategory(
                      event.target.value
                    )
                  }
                />


                {/* Author */}

                <label className="filters-label">
                  Author:
                </label>

                <input
                  type="text"
                  value={filterAuthor}
                  onChange={(event) =>
                    setFilterAuthor(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>


            <button
              onClick={handleFilterApply}
              className="search-apply-btn"
            >
              Apply
            </button>

          </div>

        </div>


        <Footer />


        {/* Mobile Bottom Navigation */}

        <div className="BottomNavbar">

          <nav className="bottom-nav">

            <Link
              to="/"
              className="nav-item"
            >
              <i className="fas fa-home"></i>
              <span>Home</span>
            </Link>


            <Link
              to="/favorites"
              className="nav-item"
            >
              <i className="fa-solid fa-heart"></i>
              <span>favorite</span>
            </Link>


            <Link
              to="/basket"
              className="nav-item"
            >
              <svg
                className="cart-icon"
                viewBox="0 -960 960 960"
              >
                <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z" />
              </svg>

              <span>
                Cart
              </span>
            </Link>


            <Link
              to="/library"
              className="nav-item"
            >
              <i className="fas fa-book"></i>
              <span>
                Library
              </span>
            </Link>


            <Link
              to="/Dashboard"
              className="nav-item"
            >
              <i className="fas fa-user"></i>
              <span>
                Dashboard
              </span>
            </Link>

          </nav>

        </div>

      </div>


      {/* Sort Bottom Sheet */}

      <div
        className={`bottom-sheet-overlay ${isSortSheetOpen
            ? "active"
            : ""
          }`}
        onClick={() =>
          setIsSortSheetOpen(false)
        }
      >

        <div
          className="bottom-sheet"
          onClick={(event) =>
            event.stopPropagation()
          }
        >

          <div className="bottom-sheet-handle" />

          <div className="bottom-sheet-title">
            Sort By
          </div>


          <div className="bottom-sheet-body">

            {SORT_OPTIONS.map((option) => (

              <div
                key={option.id}
                className={`sort-option-item ${selectedSort === option.id
                    ? "selected"
                    : ""
                  }`}
                onClick={() =>
                  handleSortSelect(option.id)
                }
              >

                <span className="sort-label">
                  {option.label}
                </span>

                <span className="check-icon">
                  ✓
                </span>

              </div>

            ))}

          </div>

        </div>

      </div>


      {/* Filter Bottom Sheet */}

      <div
        className={`bottom-sheet-overlay ${isFilterSheetOpen
            ? "active"
            : ""
          }`}
        onClick={() =>
          setIsFilterSheetOpen(false)
        }
      >

        <div
          className="bottom-sheet"
          onClick={(event) =>
            event.stopPropagation()
          }
        >

          <div className="bottom-sheet-handle" />

          <div className="bottom-sheet-title">
            Filters
          </div>


          <div className="bottom-sheet-body">

            {/* Format */}

            <div className="filter-group">

              <label className="filter-group-label">
                Format
              </label>

              <select
                value={filterFormat}
                onChange={(event) =>
                  setFilterFormat(
                    event.target.value
                  )
                }
              >

                <option value="">
                  choose one
                </option>

                {FORMAT_OPTIONS.map((option) => (

                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>

                ))}

              </select>

            </div>


            {/* Price */}

            <div className="filter-group mobile-price-range">

              <label className="filter-group-label">
                Price
              </label>


              <div className="price-range-container">

                <div className="price-range-slider-container">

                  <div
                    className="price-range-progress"
                    style={{
                      left:
                        `calc(${progressLeft2}% + ${thumbRadius2}px)`,
                      width:
                        `calc(${progressWidth2}% - ${thumbRadius2 * 0.01}px)`,
                      transform:
                        "translateY(-50%)",
                    }}
                  />


                  <input
                    type="range"
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={PRICE_STEP}
                    value={minValue}
                    onChange={handleMinChange}
                    className="price-range-slider slider-left"
                  />


                  <input
                    type="range"
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={PRICE_STEP}
                    value={maxValue}
                    onChange={handleMaxChange}
                    className="price-range-slider slider-right"
                  />

                </div>


                <div className="price-range-display">

                  <span>
                    {formatPrice(minValue)}
                  </span>

                  <span>
                    {formatPrice(maxValue)}
                  </span>

                </div>

              </div>

            </div>


            {/* Publisher */}

            <div className="filter-group">

              <label className="filter-group-label">
                Publisher
              </label>

              <input
                type="text"
                placeholder="Enter publisher..."
                value={filterPublisher}
                onChange={(event) =>
                  setFilterPublisher(
                    event.target.value
                  )
                }
              />

            </div>


            {/* Category */}

            <div className="filter-group">

              <label className="filter-group-label">
                Category
              </label>

              <input
                type="text"
                placeholder="Enter category..."
                value={filterCategory}
                onChange={(event) =>
                  setFilterCategory(
                    event.target.value
                  )
                }
              />

            </div>


            {/* Author */}

            <div className="filter-group">

              <label className="filter-group-label">
                Author
              </label>

              <input
                type="text"
                placeholder="Enter author..."
                value={filterAuthor}
                onChange={(event) =>
                  setFilterAuthor(
                    event.target.value
                  )
                }
              />

            </div>

          </div>


          <button
            className="bottom-sheet-apply-btn"
            onClick={handleFilterApply}
          >
            Apply Filters
          </button>

        </div>

      </div>

    </div>

  );
}