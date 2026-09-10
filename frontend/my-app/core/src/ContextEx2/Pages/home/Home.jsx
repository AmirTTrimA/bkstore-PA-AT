import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ---Components---
import Footer from "../../Components/Footer";
import Navbar from "../../Components/Navbar";
import ReusableSlider from "../../Components/common/ReusableSlider";
import { ThemeToggle } from "../../Components/common/ThemeToggle";
import { LanguageToggle } from "../../Components/common/LanguageToggle";
import Notification from "../../Components/feature/Notification";
import { useAuth } from "../../Context/AuthContext";
import { useLanguage } from "../../Context/LanguageContext";

// --- Styles ---
import "../../Styles/components/Home.css";

// --- Services ---
import BookService from "../../Services/BookService";
import PublisherService from "../../Services/PublisherService";
import RecommendationService from "../../Services/RecommendationService";
import { formatPrice } from "../../utils/formatPrice";

// --- Constants ---
import { ppic1 } from "../../Constants";
import { getPublisherLogo } from "../publisher/Allpublisher";

// ============================================
// Helpers
// ============================================

function extractBooks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getBookImage(book) {
  return (
    book.cover_image_url ||
    book.cover_image ||
    "https://placehold.co/400x600?text=No+Cover"
  );
}

function getBookPrice(book) {
  if (book.price === null || book.price === undefined || book.price === "") {
    return "N/A";
  }
  return formatPrice(book.price);
}

function mapBookForSlider(book) {
  return {
    id: book.id,
    title: book.title || "Untitled Book",
    price: getBookPrice(book),
    original_price: book.original_price ? formatPrice(book.original_price) : null,
    discount_percent: book.discount_percent || 0,
    has_discount: Boolean(book.has_discount),
    link: String(book.id),
    authorId: book.author_id || book.author?.id || 0,
    author_profile:
      book.author?.profile_image_url ||
      book.author_profile ||
      ppic1,
    img: getBookImage(book),
    match_reasons: book.match_reasons || [],
    similarity_score: book.similarity_score,
  };
}

const GENRE_ICONS = {
  // Canonical backend genres
  FICTION: "/icons/cat-novel.svg",
  SCI_FI: "/icons/cat-science.svg",
  HISTORY: "/icons/cat-history.svg",
  SCIENCE: "/icons/cat-science.svg",
  TECH: "/icons/cat-tech.svg",
  BUSINESS: "/icons/cat-business.svg",
  PHILOSOPHY: "/icons/cat-philosophy.svg",
  PSYCHOLOGY: "/icons/cat-psychology.svg",
  PERSIAN_LIT: "/icons/cat-persian-lit.svg",

  // Aliases / Related codes
  ART_DESIGN: "/icons/cat-art.svg",
  TRIP_GEO: "/icons/cat-trip.svg",
  FINANCIAL: "/icons/cat-business.svg",
  RELIGIOUS: "/icons/cat-religious.svg",
  NOVEL: "/icons/cat-novel.svg",
};

const getGenreIcon = (genre) => {
  if (!genre) return "/icons/cat-default.svg";
  const raw = String(genre.value || genre.slug || genre.name || genre);
  const normalized = raw.toUpperCase().replace(/[-\s]+/g, "_");
  if (GENRE_ICONS[normalized]) return GENRE_ICONS[normalized];

  if (normalized.includes("SCI") || normalized.includes("SCIENCE")) return "/icons/cat-science.svg";
  if (normalized.includes("TECH") || normalized.includes("CODE") || normalized.includes("COMPUTER")) return "/icons/cat-tech.svg";
  if (normalized.includes("PHILOSOPH") || normalized.includes("فلسفه")) return "/icons/cat-philosophy.svg";
  if (normalized.includes("PSYCHO") || normalized.includes("روان")) return "/icons/cat-psychology.svg";
  if (normalized.includes("HISTOR") || normalized.includes("تاریخ")) return "/icons/cat-history.svg";
  if (normalized.includes("PERSIAN") || normalized.includes("LIT") || normalized.includes("ادبیات") || normalized.includes("شعر")) return "/icons/cat-persian-lit.svg";
  if (normalized.includes("BUSINES") || normalized.includes("FINANC") || normalized.includes("ECONOM") || normalized.includes("مدیریت")) return "/icons/cat-business.svg";
  if (normalized.includes("FICTION") || normalized.includes("NOVEL") || normalized.includes("داستان") || normalized.includes("رمان")) return "/icons/cat-novel.svg";
  if (normalized.includes("ART") || normalized.includes("DESIGN") || normalized.includes("هنر")) return "/icons/cat-art.svg";

  return "/icons/cat-default.svg";
};

const FALLBACK_GENRES = [
  { value: "PERSIAN_LIT", label: "Persian Literature" },
  { value: "FICTION", label: "Fiction & Novels" },
  { value: "PHILOSOPHY", label: "Philosophy" },
  { value: "HISTORY", label: "History" },
  { value: "TECH", label: "Technology & Code" },
  { value: "BUSINESS", label: "Business & Finance" },
  { value: "PSYCHOLOGY", label: "Psychology" },
  { value: "SCIENCE", label: "Science & Nature" },
];

// ============================================
// Main Component
// ============================================

export default function Home() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const notificationRef = useRef();
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();

  // ----------------------------------------
  // Book & Catalog State
  // ----------------------------------------
  const [heroBooks, setHeroBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [newBooks, setNewBooks] = useState([]);
  const [discountBooks, setDiscountBooks] = useState([]);
  const [digitalBooks, setDigitalBooks] = useState([]);
  const [audioBooks, setAudioBooks] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [genres, setGenres] = useState(FALLBACK_GENRES);

  const [loadingBooks, setLoadingBooks] = useState(true);
  const [bookError, setBookError] = useState("");

  // Search input
  const [searchInputValue, setSearchInputValue] = useState("");

  // Hero carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // ============================================
  // Load Dynamic Home Data
  // ============================================
  useEffect(() => {
    let cancelled = false;

    const loadHomeData = async () => {
      try {
        setLoadingBooks(true);
        setBookError("");

        const [
          newBooksRes,
          allBooksRes,
          digitalBooksRes,
          audioBooksRes,
          publishersRes,
          genresRes,
          recommendedRes,
        ] = await Promise.allSettled([
          BookService.getNewBooks({ page_size: 10 }),
          BookService.getBooks({ page_size: 20 }),
          BookService.getBooks({ format: "DIGITAL", page_size: 10 }),
          BookService.getBooks({ format: "AUDIO", page_size: 10 }),
          PublisherService.getPublicPublishers({ page_size: 8 }),
          BookService.getGenres(),
          RecommendationService.getForYouRecommendations({ limit: 8 }),
        ]);

        if (cancelled) return;

        // 1. New Arrivals & Hero
        if (newBooksRes.status === "fulfilled") {
          const rawNew = extractBooks(newBooksRes.value);
          const mappedNew = rawNew.map(mapBookForSlider);
          setNewBooks(mappedNew);
          setHeroBooks(mappedNew.slice(0, 5));
        }

        // 2. Recommendations (Phase 3 Semantic & Personalized Engine)
        if (recommendedRes.status === "fulfilled") {
          const rawRec = extractBooks(
            recommendedRes.value?.recommendations || recommendedRes.value
          );
          setRecommendedBooks(rawRec.map(mapBookForSlider));
        }

        // 3. Best Offers / Discounted Editions
        if (allBooksRes.status === "fulfilled") {
          const rawAll = extractBooks(allBooksRes.value);
          const discounts = rawAll.filter((b) => b.has_discount && b.discount_percent > 0);
          // If few explicit discounts in first page, take all books with format discounts
          setDiscountBooks((discounts.length > 0 ? discounts : rawAll.slice(0, 10)).map(mapBookForSlider));
        }

        // 4. Digital Editions (PDFs)
        let digitalList = [];
        if (digitalBooksRes.status === "fulfilled") {
          digitalList = extractBooks(digitalBooksRes.value);
        }
        if (digitalList.length === 0 && allBooksRes.status === "fulfilled") {
          const rawAll = extractBooks(allBooksRes.value);
          digitalList = rawAll.filter(
            (b) => b.is_digital || b.formats?.some((f) => f.format === "DIGITAL" || f.is_digital)
          );
        }
        setDigitalBooks(digitalList.map(mapBookForSlider));

        // 5. Audiobooks
        let audioList = [];
        if (audioBooksRes.status === "fulfilled") {
          audioList = extractBooks(audioBooksRes.value);
        }
        if (audioList.length === 0 && allBooksRes.status === "fulfilled") {
          const rawAll = extractBooks(allBooksRes.value);
          audioList = rawAll.filter(
            (b) => b.is_audio || b.formats?.some((f) => f.format === "AUDIO" || f.is_audio)
          );
        }
        setAudioBooks(audioList.map(mapBookForSlider));

        // 6. Iranian Publishers
        if (publishersRes.status === "fulfilled") {
          const rawPubs = publishersRes.value?.results || publishersRes.value || [];
          setPublishers(Array.isArray(rawPubs) ? rawPubs : []);
        }

        // 7. Genres
        if (genresRes.status === "fulfilled") {
          const rawGenres = genresRes.value?.results || genresRes.value || [];
          setGenres(Array.isArray(rawGenres) && rawGenres.length >= 4 ? rawGenres : FALLBACK_GENRES);
        } else {
          setGenres(FALLBACK_GENRES);
        }
      } catch (err) {
        console.error("Failed loading home data:", err);
        if (!cancelled) {
          setBookError("Failed to load catalog data.");
        }
      } finally {
        if (!cancelled) {
          setLoadingBooks(false);
        }
      }
    };

    loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================
  // Search Submission
  // ============================================
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchInputValue.trim();
    if (!trimmed) {
      navigate("/search");
    } else {
      navigate(`/search/${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e);
    }
  };

  // ============================================
  // Category Pill Navigation
  // ============================================
  const handleCategoryClick = (genreItem) => {
    const genreParam = genreItem.value || genreItem.name || genreItem.title || genreItem;
    navigate(`/search?genre=${encodeURIComponent(genreParam)}`);
  };

  // ============================================
  // Hero Carousel Navigation
  // ============================================
  const totalSlides = heroBooks.length;

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (isHovered || totalSlides <= 1) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [nextSlide, isHovered, totalSlides]);

  useEffect(() => {
    if (totalSlides > 0 && currentSlide >= totalSlides) {
      setCurrentSlide(0);
    }
  }, [currentSlide, totalSlides]);

  const slide = heroBooks.length > 0 ? heroBooks[currentSlide] : null;

  // Login check for bottom nav
  const handleLoginCheck = useCallback(
    (e) => {
      if (!isLoggedIn) {
        e.preventDefault();
        notificationRef.current?.showNotif("Login required", "error", {
          linkText: "login",
          linkHref: "/login",
        });
        return false;
      }
      return true;
    },
    [isLoggedIn]
  );

  if (loadingBooks) {
    return (
      <div className="home-loading-screen">
        <div className="home-spinner"></div>
        <p>Loading Bookstore Catalog...</p>
      </div>
    );
  }

  return (
    <div className="home-page-wrapper">
      <Navbar />

      {/* Mobile Top Header */}
      <div className="TopRes">
        <nav className="top-res">
          <div className="up">
            <Link to="/home" className="logo-res">
              PageNet
            </Link>
          </div>
          <div className="down">
            <ThemeToggle page="home" />
            <LanguageToggle page="home" />
            <div className="search-res-wrapper">
              <input
                ref={inputRef}
                type="search"
                placeholder={t('nav.searchPlaceholder', 'Search catalog...')}
                className="search-res"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button
                type="button"
                className="search-res-btn"
                onClick={handleSearchSubmit}
              >
                <i className="fas fa-search"></i>
              </button>
            </div>
            <button
              onClick={() => navigate("/subscription")}
              className="sub-list"
              type="button"
              title="Subscriptions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="24px">
                <path d="M160-240q-50 0-85-35t-35-85v-240q0-50 35-85t85-35h540q50 0 85 35t35 85v240q0 50-35 85t-85 35H160Zm0-80h540q17 0 28.5-11.5T740-360v-240q0-17-11.5-28.5T700-640H160q-17 0-28.5 11.5T120-600v240q0 17 11.5 28.5T160-320Zm700-60v-200h20q17 0 28.5 11.5T920-540v120q0 17-11.5 28.5T880-380h-20Zm-700 20v-240h540v240H160Z" />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      <main className="Container_home">

        {/* GENRE / CATEGORIES PILLS */}
        {genres.length > 0 && (
          <section className="categories-section">
            <div className="section-meta-header">
              <h3>{t('home.popularCategories', 'Browse by Subject')}</h3>
              <button
                onClick={() => navigate("/search")}
                className="home-meta-link"
                type="button"
              >
                {t('common.viewAll', 'All Genres')} →
              </button>
            </div>
            <div className="categories-grid" id="home-categories">
              {genres.map((genre) => (
                <div
                  key={genre.value || genre.id || genre}
                  className="category-card"
                  onClick={() => handleCategoryClick(genre)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="category-icon">
                    <img
                      src={getGenreIcon(genre)}
                      alt={`${genre.label || genre.name || genre} icon`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/icons/cat-default.svg";
                      }}
                    />
                  </div>
                  <div className="category-title">{genre.label || genre.name || genre}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HERO FEATURED CAROUSEL */}
        <div
          className="carousel-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {bookError && <p className="subscription-state">{bookError}</p>}

          {slide ? (
            <div
              className="carousel-card"
              onClick={() => navigate(`/book/${slide.id}`)}
              role="button"
            >
              <img className="slide-image" src={slide.img} alt={slide.title} />
              <div className="slide-overlay">
                <span className="slide-featured-pill">{t('home.staffPicks', 'Featured Book')}</span>
                <h3 className="slide-title">{slide.title}</h3>
                <span className="slide-price-pill">{slide.price}</span>
              </div>
            </div>
          ) : (
            <p>{t('common.noData', 'No featured books available.')}</p>
          )}

          {totalSlides > 1 && (
            <div className="hero-carousel-nav-arrows">
              <button className="carousel-arrow left" onClick={prevSlide} type="button">
                ‹
              </button>
              <button className="carousel-arrow right" onClick={nextSlide} type="button">
                ›
              </button>
            </div>
          )}

          <div className="indicators">
            {heroBooks.map((_, index) => (
              <span
                key={index}
                className={index === currentSlide ? "dot active" : "dot"}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* DYNAMIC SECTION 0: RECOMMENDED FOR YOU (PHASE 3 SEMANTIC RECOMMENDATION ENGINE) */}
        {recommendedBooks.length > 0 && (
          <ReusableSlider
            items={recommendedBooks}
            title={t('home.recommendedForYou', 'Recommended For You')}
            viewAllLink="/search"
            customClass="home-popular"
            cardWidth="280px"
          />
        )}

        {/* DYNAMIC SECTION 1: NEW ARRIVALS */}
        <ReusableSlider
          items={newBooks}
          title={t('home.newArrivals', 'New Arrivals')}
          viewAllLink="/search/new"
          customClass="home-popular"
          cardWidth="280px"
        />

        {/* DYNAMIC SECTION 2: BEST OFFERS & SPECIAL DISCOUNTS */}
        {discountBooks.length > 0 && (
          <ReusableSlider
            items={discountBooks}
            title={t('home.bestsellers', 'Special Offers & Discounts')}
            viewAllLink="/search"
            customClass="home-popular"
            cardWidth="280px"
          />
        )}

        {/* DYNAMIC SECTION 3: DIGITAL EDITIONS (PDFs) */}
        {digitalBooks.length > 0 && (
          <ReusableSlider
            items={digitalBooks}
            title={t('book.digital', 'Digital Editions (PDF)')}
            viewAllLink="/search?format=DIGITAL"
            customClass="home-popular"
            cardWidth="280px"
          />
        )}

        {/* DYNAMIC SECTION 4: AUDIOBOOKS COLLECTION */}
        {audioBooks.length > 0 && (
          <ReusableSlider
            items={audioBooks}
            title={t('book.audio', 'Audiobooks & Spoken Audio')}
            viewAllLink="/search?format=AUDIO"
            customClass="home-popular"
            cardWidth="280px"
          />
        )}

        {/* DYNAMIC SECTION 5: IRANIAN PUBLISHING HOUSES */}
        {publishers.length > 0 && (
          <section className="publishers-showcase-section">
            <div className="section-meta-header">
              <h3>{t('publisher.title', 'Featured Iranian Publishers')}</h3>
              <button
                onClick={() => navigate("/all-publisher")}
                className="home-meta-link"
                type="button"
              >
                {t('common.viewAll', 'View All Publishers')} →
              </button>
            </div>

            <div className="publishers-grid">
              {publishers.map((pub) => (
                <div
                  key={pub.id}
                  className="publisher-card"
                  onClick={() => navigate(`/publisher/${pub.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="publisher-avatar">
                    <img
                      src={getPublisherLogo(pub.slug)}
                      alt={pub.name}
                      className="publisher-avatar-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="publisher-meta">
                    <h4>{pub.name}</h4>
                    <p className="pub-desc-line">
                      {pub.description ? pub.description.slice(0, 90) + "..." : "Authorized Publisher"}
                    </p>
                    <span className="publisher-explore-badge">
                      Browse Catalog <i className="fas fa-angle-right"></i>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <Footer />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="BottomNav">
        <nav className="bottom-navbar">
          <Link to="/" className="nav-item">
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link to="/favorites" onClick={handleLoginCheck} className="nav-item">
            <i className="fa-solid fa-heart"></i>
            <span>Favorites</span>
          </Link>
          <Link to="/basket" className="nav-item">
            <svg className="cart-icon" viewBox="0 -960 960 960">
              <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z" />
            </svg>
            <span>Cart</span>
          </Link>
          <Link to="/library" className="nav-item">
            <i className="fas fa-book"></i>
            <span>Library</span>
          </Link>
          <Link to="/dashboard" onClick={handleLoginCheck} className="nav-item">
            <i className="fas fa-user"></i>
            <span>Dashboard</span>
          </Link>
        </nav>
      </div>

      <Notification ref={notificationRef} />
    </div>
  );
}