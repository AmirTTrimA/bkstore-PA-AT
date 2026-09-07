import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import Footer from "../../Components/Footer";

import BookService from "../../Services/BookService";
import { formatPrice } from "../../utils/formatPrice";
import { ppic1 } from "../../Constants";
import "../../Styles/components/Author.css";

export default function Author() {
  const navigate = useNavigate();
  const { authorId } = useParams();

  const [authorData, setAuthorData] = useState(null);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");

    const fetchAuthor = async () => {
      try {
        const data = await BookService.getAuthorById(authorId);
        if (!isMounted) return;
        setAuthorData(data);

        // If serializer includes books, use them; otherwise fetch books by author
        if (data.books && Array.isArray(data.books)) {
          setBooks(data.books);
        } else {
          const booksRes = await BookService.getBooks({ author: authorId });
          const bookList = booksRes.results || booksRes || [];
          if (isMounted) setBooks(bookList);
        }
      } catch (err) {
        console.error("Failed to load author:", err);
        if (isMounted) {
          setError(
            err.response?.status === 404
              ? "Author not found."
              : "Failed to load author information."
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAuthor();

    return () => {
      isMounted = false;
    };
  }, [authorId]);

  if (isLoading) {
    return (
      <div className="author-page-wrapper">
        <div className="author-nav-full">
          <Navbar />
        </div>
        <div className="author-nav-res">
          <SimpleNav />
        </div>
        <div className="author-container author-loading-box">
          <div className="author-spinner"></div>
          <p>Loading author details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !authorData) {
    return (
      <div className="author-page-wrapper">
        <div className="author-nav-full">
          <Navbar />
        </div>
        <div className="author-nav-res">
          <SimpleNav />
        </div>
        <div className="author-container author-not-found-box">
          <h2>{error || "Author Not Found"}</h2>
          <p>We couldn't locate this author in our catalog.</p>
          <button className="author-action-btn" onClick={() => navigate("/library")}>
            Explore Book Catalog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="author-page-wrapper">
      <div className="author-nav-full">
        <Navbar />
      </div>
      <div className="author-nav-res">
        <SimpleNav />
      </div>

      <main className="author-container">
        {/* Top bar with back button & breadcrumbs */}
        <div className="author-top-bar">
          <button
            className="author-back-btn"
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            <i className="fas fa-angle-left"></i> Back
          </button>
          <div className="author-breadcrumbs">
            <button onClick={() => navigate("/home")} className="crumb-link">
              Home
            </button>
            <span className="crumb-sep">/</span>
            <button onClick={() => navigate("/library")} className="crumb-link">
              Authors
            </button>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{authorData.name}</span>
          </div>
        </div>

        {/* Author Profile Section */}
        <div className="up-side">
          <div className="profile">
            <img
              src={authorData.profile_image || ppic1}
              alt={authorData.name}
              loading="lazy"
            />
          </div>
          <div className="auth-desc">
            <div className="auth-des">
              <h2>{authorData.name}</h2>
              <div className="author-meta-badges">
                {authorData.books_count !== undefined && (
                  <span className="author-meta-count">
                    <i className="fas fa-book" style={{ marginRight: 6 }}></i>
                    {authorData.books_count} Published Works
                  </span>
                )}
                {authorData.nationality && (
                  <span className="author-meta-nationality">
                    <i className="fas fa-globe" style={{ marginRight: 6 }}></i>
                    {authorData.nationality}
                  </span>
                )}
              </div>
              <p className="author-biography">
                {authorData.biography || "No biography available for this author."}
              </p>
            </div>
          </div>
        </div>

        {/* Books by Author Section */}
        <div className="author-books-section">
          <div className="author-books-header">
            <h3>Books by {authorData.name}</h3>
            <span className="author-books-count-tag">
              {books.length} {books.length === 1 ? "Book" : "Books"} Available
            </span>
          </div>

          {books.length === 0 ? (
            <div className="author-books-empty">
              <p>No books currently available for this author.</p>
            </div>
          ) : (
            <div className="author-books-grid">
              {books.map((book) => {
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
                      />
                      <div className="author-book-formats-badges">
                        {book.is_digital && (
                          <span title="Digital PDF available">📱</span>
                        )}
                        {book.is_audio && (
                          <span title="Audiobook available">🎧</span>
                        )}
                      </div>
                    </div>

                    <div className="author-book-info">
                      <span className="author-book-genre">
                        {book.genre || "General"}
                      </span>
                      <h4 className="author-book-title">{bookTitle}</h4>

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
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
