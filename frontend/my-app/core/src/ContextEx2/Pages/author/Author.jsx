import React, { useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import Navbar from "../../Components/Navbar";
import BottomNav from "../../Components/common/BottomNav";
import Footer from "../../Components/Footer";
import { useLanguage } from "../../Context/LanguageContext";

import { useAuthorDetail, useBooks } from "../../Hooks/queries";
import { formatPrice } from "../../utils/formatPrice";
import { ppic1 } from "../../Constants";
import "../../Styles/components/Author.css";

export default function Author() {
  const navigate = useNavigate();
  const { authorId } = useParams();
  const { t } = useLanguage();

  const [formatFilter, setFormatFilter] = useState("ALL");
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const {
    data: authorData,
    isLoading: isAuthorLoading,
    error: authorErr,
  } = useAuthorDetail(authorId);

  const authorHasBooks = Boolean(
    authorData?.books && Array.isArray(authorData.books) && authorData.books.length > 0
  );

  const {
    data: booksData,
    isLoading: isBooksLoading,
  } = useBooks(
    { author: authorId },
    { enabled: Boolean(authorId && !authorHasBooks) }
  );

  const books = useMemo(() => {
    if (authorHasBooks) {
      return authorData.books;
    }
    return booksData?.results || (Array.isArray(booksData) ? booksData : []);
  }, [authorHasBooks, authorData?.books, booksData]);

  const isLoading = isAuthorLoading || (!authorHasBooks && isBooksLoading);
  const error = authorErr
    ? authorErr.response?.status === 404
      ? "Author not found."
      : "Failed to load author information."
    : "";

  const filteredBooks = useMemo(() => {
    if (formatFilter === "PHYSICAL") {
      return books.filter(
        (b) =>
          b.formats?.some((f) => f.format === "PHYSICAL") ||
          (!b.is_digital && !b.is_audio)
      );
    }
    if (formatFilter === "DIGITAL") {
      return books.filter(
        (b) =>
          b.is_digital ||
          b.formats?.some((f) => f.format === "DIGITAL" || f.is_digital)
      );
    }
    if (formatFilter === "AUDIO") {
      return books.filter(
        (b) =>
          b.is_audio ||
          b.formats?.some((f) => f.format === "AUDIO" || f.is_audio)
      );
    }
    return books;
  }, [books, formatFilter]);

  if (isLoading) {
    return (
      <div className="author-page-wrapper">
        <Navbar />
        <div className="author-container author-loading-box">
          <div className="author-spinner"></div>
          <p>{t("common.loading", "Loading author details...")}</p>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (error || !authorData) {
    return (
      <div className="author-page-wrapper">
        <Navbar />
        <div className="author-container author-not-found-box">
          <h2>{error || t("author.notFound", "Author Not Found")}</h2>
          <p>{t("author.notFoundDesc", "We couldn't locate this author in our catalog.")}</p>
          <button
            className="author-action-btn"
            onClick={() => navigate("/library")}
          >
            {t("library.exploreCatalog", "Explore Book Catalog")}
          </button>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const biography = authorData.biography || "";
  const isBioLong = biography.length > 220;

  return (
    <div className="author-page-wrapper">
      <Navbar />

      <main className="author-container">
        {/* Top bar with back button & breadcrumbs */}
        <div className="author-top-bar">
          <button
            className="author-back-btn"
            onClick={() => navigate(-1)}
            title={t("common.back", "Go Back")}
            type="button"
          >
            ← {t("common.back", "Back")}
          </button>
          <div className="author-breadcrumbs">
            <Link to="/home">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <Link to="/library">{t("author.authors", "Authors")}</Link>
            <span>/</span>
            <span className="current">{authorData.name}</span>
          </div>
        </div>

        {/* Author Hero Profile */}
        <div className="author-hero-card">
          <div className="author-avatar-wrap">
            <img
              src={authorData.profile_image || ppic1}
              alt={authorData.name}
              className="author-profile-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = ppic1;
              }}
              loading="lazy"
            />
          </div>
          <div className="author-hero-content">
            <div className="author-hero-header">
              <span className="author-verified-pill">
                <i className="fas fa-check-circle"></i> {t("author.verifiedAuthor", "Verified Author")}
              </span>
              <h2 className="author-hero-name">{authorData.name}</h2>
            </div>

            <div className="author-stats-row">
              {authorData.books_count !== undefined && (
                <span className="author-stat-chip">
                  <i className="fas fa-book"></i>
                  <strong>{authorData.books_count}</strong> {t("author.publishedWorks", "Published Works")}
                </span>
              )}
              {authorData.nationality && (
                <span className="author-stat-chip">
                  <i className="fas fa-globe"></i>
                  <strong>{authorData.nationality}</strong>
                </span>
              )}
            </div>

            {biography ? (
              <div className="author-biography-wrap">
                <p className="author-biography">
                  {isBioLong && !isBioExpanded
                    ? biography.slice(0, 220) + "..."
                    : biography}
                </p>
                {isBioLong && (
                  <button
                    type="button"
                    className="author-bio-toggle-btn"
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                  >
                    {isBioExpanded ? t("common.showLess", "Show Less ↑") : t("common.readMore", "Read More ↓")}
                  </button>
                )}
              </div>
            ) : (
              <p className="author-biography">
                {t("author.noBio", "No biography available for this author.")}
              </p>
            )}
          </div>
        </div>

        {/* Books by Author Section */}
        <div className="author-books-section">
          <div className="author-books-header">
            <div className="author-books-header-left">
              <h3>{t("author.publishedBooks", "Published Books")}</h3>
              <span className="author-books-count-tag">
                {t("author.booksAvailable", "{count} Books Available", { count: filteredBooks.length })}
              </span>
            </div>

            {/* Format Filter Tabs */}
            <div className="author-format-tabs">
              <button
                type="button"
                className={`author-format-tab ${formatFilter === "ALL" ? "active" : ""}`}
                onClick={() => setFormatFilter("ALL")}
              >
                {t("common.all", "All")} ({books.length})
              </button>
              <button
                type="button"
                className={`author-format-tab ${formatFilter === "PHYSICAL" ? "active" : ""}`}
                onClick={() => setFormatFilter("PHYSICAL")}
              >
                {t("book.physical", "Physical")}
              </button>
              <button
                type="button"
                className={`author-format-tab ${formatFilter === "DIGITAL" ? "active" : ""}`}
                onClick={() => setFormatFilter("DIGITAL")}
              >
                📱 {t("book.digital", "Digital")}
              </button>
              <button
                type="button"
                className={`author-format-tab ${formatFilter === "AUDIO" ? "active" : ""}`}
                onClick={() => setFormatFilter("AUDIO")}
              >
                🎧 {t("book.audio", "Audio")}
              </button>
            </div>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="author-books-empty">
              <i className="fas fa-book-open author-empty-icon"></i>
              <h4>{t("library.noBooksFound", "No books found")}</h4>
              <p>
                {books.length === 0
                  ? t("author.noBooksDesc", "No published books available for this author yet.")
                  : t("publisher.noFormatBooks", "No books matching the selected format filter.")}
              </p>
              {formatFilter !== "ALL" && (
                <button
                  type="button"
                  className="author-reset-filter-btn"
                  onClick={() => setFormatFilter("ALL")}
                >
                  {t("publisher.showAllFormats", "Show All Formats")}
                </button>
              )}
            </div>
          ) : (
            <div className="author-books-grid">
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
                const price = book.price;
                const origPrice = book.original_price;

                return (
                  <Link
                    key={bookId}
                    to={`/book/${bookId}`}
                    className="author-book-card"
                  >
                    <div className="author-book-cover-wrap">
                      {hasDiscount && discountPercent > 0 && (
                        <span className="author-book-discount-badge">
                          -{discountPercent}%
                        </span>
                      )}
                      <img
                        src={bookImg}
                        alt={bookTitle}
                        loading="lazy"
                        className="author-book-cover-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-book.png";
                        }}
                      />
                      <div className="author-book-formats-badges">
                        {(book.is_digital ||
                          book.formats?.some(
                            (f) => f.format === "DIGITAL" || f.is_digital
                          )) && <span title="Digital PDF available">📱</span>}
                        {(book.is_audio ||
                          book.formats?.some(
                            (f) => f.format === "AUDIO" || f.is_audio
                          )) && <span title="Audiobook available">🎧</span>}
                      </div>
                    </div>

                    <div className="author-book-info">
                      <span className="author-book-genre">
                        {book.genre || "General"}
                      </span>
                      <h4 className="author-book-title" title={bookTitle}>
                        {bookTitle}
                      </h4>

                      <div className="author-book-pricing">
                        {hasDiscount && origPrice ? (
                          <div className="author-price-discount-box">
                            <span className="author-price-orig">
                              {formatPrice(origPrice)}
                            </span>
                            <span className="author-price-final discounted">
                              {formatPrice(price)}
                            </span>
                          </div>
                        ) : (
                          <span className="author-price-final">
                            {formatPrice(price)}
                          </span>
                        )}
                      </div>

                      <span className="author-book-action-btn">
                        {t("book.viewDetails", "View Details")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
