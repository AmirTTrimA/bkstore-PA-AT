import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import BottomNav from '../../Components/common/BottomNav';
import Footer from '../../Components/Footer';
import { useLanguage } from '../../Context/LanguageContext';
import PublisherService from '../../Services/PublisherService';
import BookService from '../../Services/BookService';
import { formatPrice } from '../../utils/formatPrice';
import { getPublisherLogo } from './Allpublisher';
import "../../Styles/components/Publisher.css";

export default function Publisher() {
  const navigate = useNavigate();
  const { pubId } = useParams();
  const { t } = useLanguage();

  // --- State ---
  const [publisher, setPublisher] = useState(null);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPublisherAndBooks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch Publisher Details
        const pubData = await PublisherService.getPublicPublisher(pubId);
        if (!isMounted) return;
        setPublisher(pubData);

        // Fetch Publisher's Books from Catalog
        const booksRes = await BookService.getBooks({
          publisher: pubId,
          page_size: 50,
        });

        if (!isMounted) return;
        const bookList = booksRes.results || (Array.isArray(booksRes) ? booksRes : []);
        setBooks(bookList);
      } catch (err) {
        console.error("Failed to load publisher details:", err);
        if (isMounted) {
          setError(
            err.response?.status === 404
              ? "Publishing house not found."
              : "Failed to load publishing house details."
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPublisherAndBooks();

    return () => {
      isMounted = false;
    };
  }, [pubId]);

  // Counts for format filters
  const formatCounts = useMemo(() => {
    let physical = 0;
    let digital = 0;
    let audio = 0;

    books.forEach((b) => {
      const hasPhysical = b.formats?.some((f) => f.format === 'PHYSICAL') || (!b.is_digital && !b.is_audio);
      const hasDigital = b.is_digital || b.formats?.some((f) => f.format === 'DIGITAL' || f.is_digital);
      const hasAudio = b.is_audio || b.formats?.some((f) => f.format === 'AUDIO' || f.is_audio);

      if (hasPhysical) physical++;
      if (hasDigital) digital++;
      if (hasAudio) audio++;
    });

    return { all: books.length, physical, digital, audio };
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    if (formatFilter === 'PHYSICAL') {
      return books.filter((b) => b.formats?.some((f) => f.format === 'PHYSICAL') || (!b.is_digital && !b.is_audio));
    }
    if (formatFilter === 'DIGITAL') {
      return books.filter((b) => b.is_digital || b.formats?.some((f) => f.format === 'DIGITAL' || f.is_digital));
    }
    if (formatFilter === 'AUDIO') {
      return books.filter((b) => b.is_audio || b.formats?.some((f) => f.format === 'AUDIO' || f.is_audio));
    }
    return books;
  }, [books, formatFilter]);

  // Unique authors count fallback if not provided by backend
  const uniqueAuthorsCount = useMemo(() => {
    if (publisher?.authors_count) return publisher.authors_count;
    const authorIds = new Set();
    books.forEach((b) => {
      const aId = b.author_id || b.author?.id;
      if (aId) authorIds.add(aId);
    });
    return authorIds.size;
  }, [publisher, books]);






  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="publisher-page-wrapper">
        <Navbar />
        <div className="publisher-container publisher-loading-box">
          <div className="publisher-spinner"></div>
          <p>{t("common.loading", "Loading publisher information...")}</p>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  // --- Error / Not Found State ---
  if (error || !publisher) {
    return (
      <div className="publisher-page-wrapper">
        <Navbar />
        <div className="publisher-container publisher-error-box">
          <div className="publisher-error-icon">
            <i className="fas fa-landmark"></i>
          </div>
          <h2>{error || t("publisher.notFound", "Publisher Not Found")}</h2>
          <p>
            {t("publisher.notFoundDesc", "The requested publisher could not be found or has not published catalog entries yet.")}
          </p>
          <div className="publisher-error-actions">
            <button
              onClick={() => navigate('/all-publisher')}
              className="publisher-primary-btn"
              type="button"
            >
              {t("publisher.browseAll", "Browse All Publishers")}
            </button>
            <button
              onClick={() => navigate('/home')}
              className="publisher-secondary-btn"
              type="button"
            >
              {t("common.backToHome", "Back to Home")}
            </button>
          </div>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const logo = getPublisherLogo(publisher.slug);
  const description = publisher.description || "";
  const isLongDesc = description.length > 200;

  return (
    <div className="publisher-page-wrapper">
      <Navbar />

      <div className="publisher-container">
        {/* Top bar with Back Button & Breadcrumbs */}
        <div className="publisher-top-bar">
          <button
            onClick={() => navigate(-1)}
            className="publisher-back-btn"
            type="button"
            title={t("common.back", "Go Back")}
          >
            ← {t("common.back", "Back")}
          </button>
          <div className="publisher-breadcrumbs">
            <Link to="/home">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <Link to="/all-publisher">{t("publisher.publishers", "Publishers")}</Link>
            <span>/</span>
            <span className="current">{publisher.name}</span>
          </div>
        </div>

        {/* Publisher Hero Profile */}
        <div className="publisher-hero-card">
          <div className="publisher-hero-logo-wrap">
            <img
              src={logo}
              alt={publisher.name}
              className="publisher-hero-logo"
            />
          </div>

          <div className="publisher-hero-content">
            <div className="publisher-hero-header">
              <span className="publisher-verified-pill">
                <i className="fas fa-check-circle"></i> {t("publisher.authorizedPublisher", "Authorized Publisher")}
              </span>
              <h1 className="publisher-hero-name">{publisher.name}</h1>
            </div>

            <div className="publisher-stats-row">
              <span className="pub-stat-chip">
                <i className="fas fa-book"></i>
                <strong>{publisher.books_count || books.length}</strong> {t("publisher.publications", "Publications")}
              </span>
              <span className="pub-stat-chip">
                <i className="fas fa-user-edit"></i>
                <strong>{uniqueAuthorsCount}</strong> {t("publisher.authors", "Authors")}
              </span>
              {publisher.website && (
                <a
                  href={publisher.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pub-stat-chip pub-website-chip"
                >
                  <i className="fas fa-globe"></i> {t("publisher.officialWebsite", "Official Website")}{" "}
                  <i className="fas fa-external-link-alt" style={{ fontSize: "0.75rem" }}></i>
                </a>
              )}
            </div>

            {description && (
              <div className="publisher-description-wrap">
                <p className="publisher-description-text">
                  {isLongDesc && !isDescExpanded
                    ? description.slice(0, 200) + "..."
                    : description}
                </p>
                {isLongDesc && (
                  <button
                    type="button"
                    className="publisher-desc-toggle-btn"
                    onClick={() => setIsDescExpanded((prev) => !prev)}
                  >
                    {isDescExpanded ? t("common.showLess", "Show Less ↑") : t("common.showMore", "Show More ↓")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Publications Catalog Section */}
        <div className="publisher-catalog-section">
          <div className="publisher-catalog-header">
            <div className="publisher-catalog-title-wrap">
              <h2>{t("publisher.publicationsBy", "Publications by {name}", { name: publisher.name })}</h2>
              <span className="publisher-catalog-total-tag">
                {books.length} {t("publisher.booksInCatalog", books.length === 1 ? "Book in Catalog" : "Books in Catalog", { count: books.length })}
              </span>
            </div>

            {/* Format Filter Tabs */}
            {books.length > 0 && (
              <div className="publisher-format-tabs">
                <button
                  type="button"
                  className={`format-tab-btn ${formatFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setFormatFilter('ALL')}
                >
                  {t("common.all", "All")} ({formatCounts.all})
                </button>
                {formatCounts.physical > 0 && (
                  <button
                    type="button"
                    className={`format-tab-btn ${formatFilter === 'PHYSICAL' ? 'active' : ''}`}
                    onClick={() => setFormatFilter('PHYSICAL')}
                  >
                    {t("book.physical", "Physical")} ({formatCounts.physical})
                  </button>
                )}
                {formatCounts.digital > 0 && (
                  <button
                    type="button"
                    className={`format-tab-btn ${formatFilter === 'DIGITAL' ? 'active' : ''}`}
                    onClick={() => setFormatFilter('DIGITAL')}
                  >
                    {t("book.digital", "E-Books / PDF")} ({formatCounts.digital})
                  </button>
                )}
                {formatCounts.audio > 0 && (
                  <button
                    type="button"
                    className={`format-tab-btn ${formatFilter === 'AUDIO' ? 'active' : ''}`}
                    onClick={() => setFormatFilter('AUDIO')}
                  >
                    {t("book.audio", "Audiobooks")} ({formatCounts.audio})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Books Grid */}
          {filteredBooks.length === 0 ? (
            <div className="publisher-books-empty">
              <i className="fas fa-book-open publisher-empty-icon"></i>
              <h3>{t("publisher.noFormatBooks", "No books found for this format filter")}</h3>
              <p>{t("publisher.noFormatBooksDesc", "Try selecting \"All\" or exploring our general bookstore catalog.")}</p>
              <button
                type="button"
                className="publisher-clear-filter-btn"
                onClick={() => setFormatFilter('ALL')}
              >
                {t("publisher.showAllFormats", "Show All Formats")}
              </button>
            </div>
          ) : (
            <div className="publisher-books-grid">
              {filteredBooks.map((book) => {
                const bookId = book.id || book.searchId;
                const bookTitle = book.title || book.name;
                const bookImg =
                  book.cover_image_url ||
                  book.cover_image ||
                  book.imgUrl ||
                  "/default-book.png";
                const hasDiscount = Boolean(book.has_discount);
                const discountPercent = book.discount_percent || 0;
                const authorName = book.author?.name || book.author_name || t("book.unknownAuthor", "Unknown Author");
                const authorId = book.author_id || book.author?.id;

                return (
                  <div key={bookId} className="pub-book-card">
                    <Link to={`/book/${bookId}`} className="pub-book-cover-link">
                      <div className="pub-book-cover-wrap">
                        {hasDiscount && discountPercent > 0 && (
                          <span className="pub-book-discount-badge">
                            -{discountPercent}%
                          </span>
                        )}
                        <img
                          src={bookImg}
                          alt={bookTitle}
                          loading="lazy"
                          className="pub-book-cover-img"
                        />
                        <div className="pub-book-formats-badges">
                          {book.is_digital && (
                            <span className="format-tag-digital" title="Digital PDF">📱</span>
                          )}
                          {book.is_audio && (
                            <span className="format-tag-audio" title="Audiobook">🎧</span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="pub-book-card-info">
                      <Link to={`/book/${bookId}`} className="pub-book-title-link">
                        <h4 className="pub-book-title">{bookTitle}</h4>
                      </Link>

                      {authorId ? (
                        <Link to={`/author/${authorId}`} className="pub-book-author-link">
                          <i className="fas fa-feather-alt"></i> {authorName}
                        </Link>
                      ) : (
                        <span className="pub-book-author-text">
                          <i className="fas fa-feather-alt"></i> {authorName}
                        </span>
                      )}

                      <div className="pub-book-price-row">
                        {hasDiscount && book.original_price ? (
                          <div className="pub-book-price-discounted">
                            <span className="pub-book-orig-price">
                              {formatPrice(book.original_price)}
                            </span>
                            <span className="pub-book-final-price">
                              {formatPrice(book.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="pub-book-final-price">
                            {formatPrice(book.price)}
                          </span>
                        )}
                      </div>

                      <Link to={`/book/${bookId}`} className="pub-book-action-btn">
                        {t("book.viewDetails", "View Details")}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      <Footer />
    </div>
  );
}

