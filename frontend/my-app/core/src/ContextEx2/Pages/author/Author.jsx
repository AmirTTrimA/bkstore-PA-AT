import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import SimpleNav from "../../Components/SimpleNav";
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
        <SimpleNav />
        <div className="author-container author-loading-box">
          <div className="author-spinner"></div>
          <p>Loading author details...</p>
        </div>
      </div>
    );
  }

  if (error || !authorData) {
    return (
      <div className="author-page-wrapper">
        <SimpleNav />
        <div className="author-container author-not-found-box">
          <h2>{error || "Author Not Found"}</h2>
          <p>We couldn't locate this author in our catalog.</p>
          <button className="author-action-btn" onClick={() => navigate("/library")}>
            Explore Book Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="author-page-wrapper">
      <div className="auth-nav">
        <SimpleNav />
      </div>

      <div className="author-container">
        {/* Back Button */}
        <div className="author-header-actions">
          <button
            className="big-back-btn"
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            <i className="fas fa-angle-left"></i>
          </button>
          <Link to="/library" className="author-browse-link">
            ← Catalog
          </Link>
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
            <span className="auth-des">
              <h2>{authorData.name}</h2>
              {authorData.books_count !== undefined && (
                <span className="author-meta-count">
                  {authorData.books_count} Published Books
                </span>
              )}
              <p className="author-biography">
                {authorData.biography || "No biography available for this author."}
              </p>
            </span>
          </div>
        </div>

        {/* Books by Author Section */}
        <div className="down-side">
          <div className="author-section-heading">
            <h3>Books by {authorData.name}</h3>
            <span className="author-book-count-tag">
              {books.length} {books.length === 1 ? "Book" : "Books"}
            </span>
          </div>

          <div className="product">
            {books && books.length > 0 ? (
              books.map((book) => {
                const bookCover =
                  book.cover_image_url ||
                  book.cover_image ||
                  "https://placehold.co/400x600?text=No+Cover";

                return (
                  <div
                    key={book.id}
                    className="auth-cards"
                    onClick={() => navigate(`/book/${book.id}`)}
                  >
                    <div className="auth-pic">
                      <img
                        src={bookCover}
                        className="auth-book-img"
                        alt={book.title}
                        loading="lazy"
                      />
                      {book.has_discount && book.discount_percent > 0 && (
                        <span className="author-discount-badge">
                          -{book.discount_percent}%
                        </span>
                      )}
                    </div>

                    <div className="author-card-content">
                      <h4 className="author-card-title" title={book.title}>
                        {book.title}
                      </h4>

                      {/* Format Badges */}
                      <div className="author-card-formats">
                        {book.formats && book.formats.length > 0 ? (
                          book.formats.map((f) => (
                            <span key={f.id} className="author-format-pill">
                              {f.type}
                            </span>
                          ))
                        ) : (
                          <span className="author-format-pill">Available</span>
                        )}
                      </div>

                      {/* Price Block */}
                      <div className="author-card-price-row">
                        {book.has_discount && book.original_price ? (
                          <>
                            <span className="author-card-original-price">
                              {formatPrice(book.original_price)}
                            </span>
                            <span className="author-card-final-price">
                              {formatPrice(book.price)}
                            </span>
                          </>
                        ) : (
                          <span className="author-card-final-price">
                            {book.price ? formatPrice(book.price) : "N/A"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-books-box">
                <p>No published books available for this author yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
