import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ---Components---
import Footer from "../../Components/Footer";
import Navbar from "../../Components/Navbar";
import BottomNav from "../../Components/common/BottomNav";
import ReusableSlider from "../../Components/common/ReusableSlider";
import Notification from "../../Components/feature/Notification";
import { useLanguage } from "../../Context/LanguageContext";

// --- Styles ---
import "../../Styles/components/Home.css";

// --- React Query Hooks ---
import {
  useNewBooks,
  useBooks,
  usePublicPublishers,
  useGenres,
  useForYouRecommendations,
} from "../../Hooks/queries";

// --- Services & Utils ---
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
  const notificationRef = useRef();
  const { t } = useLanguage();

  // ----------------------------------------
  // Book & Catalog React Query Data
  // ----------------------------------------
  const { data: newBooksData, isLoading: loadingNew, isError: errorNew } = useNewBooks({ page_size: 10 });
  const { data: allBooksData, isLoading: loadingAll, isError: errorAll } = useBooks({ page_size: 20 });
  const { data: digitalBooksData } = useBooks({ format: "DIGITAL", page_size: 10 });
  const { data: audioBooksData } = useBooks({ format: "AUDIO", page_size: 10 });
  const { data: publishersData } = usePublicPublishers();
  const { data: genresData } = useGenres();
  const { data: recommendedData } = useForYouRecommendations({ limit: 8 });

  const loadingBooks = loadingNew || loadingAll;
  const bookError = (errorNew && errorAll) ? "Failed to load catalog data." : "";

  // Memoized Sliders & Derivations (Cached by React Query)
  const newBooks = useMemo(() => {
    const rawNew = extractBooks(newBooksData);
    return rawNew.map(mapBookForSlider);
  }, [newBooksData]);

  const heroBooks = useMemo(() => {
    return newBooks.slice(0, 5);
  }, [newBooks]);

  const recommendedBooks = useMemo(() => {
    const rawRec = extractBooks(recommendedData?.recommendations || recommendedData);
    return rawRec.map(mapBookForSlider);
  }, [recommendedData]);

  const discountBooks = useMemo(() => {
    const rawAll = extractBooks(allBooksData);
    const discounts = rawAll.filter((b) => b.has_discount && b.discount_percent > 0);
    return (discounts.length > 0 ? discounts : rawAll.slice(0, 10)).map(mapBookForSlider);
  }, [allBooksData]);

  const digitalBooks = useMemo(() => {
    let digitalList = extractBooks(digitalBooksData);
    if (digitalList.length === 0 && allBooksData) {
      const rawAll = extractBooks(allBooksData);
      digitalList = rawAll.filter(
        (b) => b.is_digital || b.formats?.some((f) => f.format === "DIGITAL" || f.is_digital)
      );
    }
    return digitalList.map(mapBookForSlider);
  }, [digitalBooksData, allBooksData]);

  const audioBooks = useMemo(() => {
    let audioList = extractBooks(audioBooksData);
    if (audioList.length === 0 && allBooksData) {
      const rawAll = extractBooks(allBooksData);
      audioList = rawAll.filter(
        (b) => b.is_audio || b.formats?.some((f) => f.format === "AUDIO" || f.is_audio)
      );
    }
    return audioList.map(mapBookForSlider);
  }, [audioBooksData, allBooksData]);

  const publishers = useMemo(() => {
    const rawPubs = publishersData?.results || publishersData || [];
    return Array.isArray(rawPubs) ? rawPubs : [];
  }, [publishersData]);

  const genres = useMemo(() => {
    const rawGenres = genresData?.results || genresData || [];
    return Array.isArray(rawGenres) && rawGenres.length >= 4 ? rawGenres : FALLBACK_GENRES;
  }, [genresData]);

  // Hero carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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

      </main>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      <Notification ref={notificationRef} />
    </div>
  );
}