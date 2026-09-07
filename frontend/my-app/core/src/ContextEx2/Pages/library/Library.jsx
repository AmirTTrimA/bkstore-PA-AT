import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import BookService from "../../Services/BookService";
import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import Footer from "../../Components/Footer";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Library.css";

// ============================================
//      Main
// ============================================

export default function Library() {
    const navigate = useNavigate();

    // ============================================
    //      State
    // ============================================

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState("");

    // ============================================
    //      Refs
    // ============================================

    const loadingRef = useRef(false);
    const currentPageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const requestedPagesRef = useRef(new Set());

    // ============================================
    //      Load Books
    // ============================================

    const loadBooks = useCallback(async (pageNumber) => {
        if (
            loadingRef.current ||
            !hasMoreRef.current ||
            requestedPagesRef.current.has(pageNumber)
        ) {
            return false;
        }

        requestedPagesRef.current.add(pageNumber);
        loadingRef.current = true;
        setError("");

        if (pageNumber === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const response = await BookService.getBooks({
                page: pageNumber,
            });

            const results = response.results || [];
            const nextExists = Boolean(response.next);

            setBooks(previousBooks => {
                if (pageNumber === 1) {
                    return results;
                }

                const existingIds = new Set(
                    previousBooks.map(book => book.id)
                );

                const newBooks = results.filter(
                    book => !existingIds.has(book.id)
                );

                return [
                    ...previousBooks,
                    ...newBooks,
                ];
            });

            currentPageRef.current = pageNumber;
            hasMoreRef.current = nextExists;
            setHasMore(nextExists);

            return nextExists;
        } catch (err) {
            console.error(
                `Failed loading library page ${pageNumber}:`,
                err
            );
            requestedPagesRef.current.delete(pageNumber);
            setError("Could not load books.");
            return false;
        } finally {
            loadingRef.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // ============================================
    //      Initial Load
    // ============================================

    useEffect(() => {
        loadBooks(1);
    }, [loadBooks]);

    // ============================================
    //      Infinite Scroll
    // ============================================

    useEffect(() => {
        const handleScroll = () => {
            if (
                loadingRef.current ||
                !hasMoreRef.current
            ) {
                return;
            }

            const scrollPosition =
                window.innerHeight +
                window.scrollY;

            const threshold =
                document.documentElement.scrollHeight -
                700;

            if (scrollPosition >= threshold) {
                const nextPage =
                    currentPageRef.current + 1;

                loadBooks(nextPage);
            }
        };

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true }
        );

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            );
        };
    }, [loadBooks]);

    // ============================================
    //      Loading Initial
    // ============================================

    if (loading) {
        return (
            <div className="all">
                <div className="full-lib-nav">
                    <Navbar />
                </div>
                <div className="lib-nav">
                    <SimpleNav />
                </div>

                <div className="lib-container">
                    <div className="library-message">
                        <div className="library-spinner" />
                        <p>Loading book catalog...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ============================================
    //      Render
    // ============================================

    return (
        <div className="all">
            {/* Desktop Navigation */}
            <div className="full-lib-nav">
                <Navbar />
            </div>

            {/* Mobile Navigation */}
            <div className="lib-nav">
                <SimpleNav />
            </div>

            {/* Main Container */}
            <div className="lib-container">
                {/* Top Bar with Back button & Breadcrumbs */}
                <div className="library-top-bar">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="library-back-btn"
                        title="Go Back"
                    >
                        ← Back
                    </button>
                    <div className="library-breadcrumbs">
                        <Link to="/home">Home</Link>
                        <span>/</span>
                        <span className="current">Book Catalog</span>
                    </div>
                </div>

                {/* Header */}
                <div className="head">
                    <p className="head-txt">
                        Explore Catalog
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="library-message library-error">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => loadBooks(1)}
                            className="library-retry-btn"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!error && books.length === 0 && (
                    <div className="library-message">
                        <h2>No books found</h2>
                        <p>There are no books available in the catalog yet.</p>
                    </div>
                )}

                {/* Books Grid */}
                {books.length > 0 && (
                    <div className="explore">
                        {books.map(book => {
                            const hasDiscount = Boolean(book.has_discount);
                            const discountPercent = book.discount_percent || 0;
                            const price = book.price;
                            const origPrice = book.original_price;

                            return (
                                <Link
                                    key={book.id}
                                    to={`/book/${book.id}`}
                                    className="card-ha"
                                >
                                    {/* Cover Wrap */}
                                    <div className="library-card-cover">
                                        {hasDiscount && discountPercent > 0 && (
                                            <span className="library-card-discount-badge">
                                                -{discountPercent}%
                                            </span>
                                        )}
                                        <img
                                            src={
                                                book.cover_image_url ||
                                                "/default-book.png"
                                            }
                                            alt={book.title}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/default-book.png";
                                            }}
                                        />
                                        <div className="library-card-formats-badges">
                                            {(book.is_digital || book.formats?.some(f => f.format === "DIGITAL" || f.is_digital)) && (
                                                <span title="Digital PDF available">📱</span>
                                            )}
                                            {(book.is_audio || book.formats?.some(f => f.format === "AUDIO" || f.is_audio)) && (
                                                <span title="Audiobook available">🎧</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Information */}
                                    <div className="library-card-info">
                                        <h3
                                            className="library-card-title"
                                            title={book.title}
                                        >
                                            {book.title}
                                        </h3>

                                        <p className="library-card-author">
                                            {book.author_name ||
                                                book.author?.name ||
                                                "Unknown Author"}
                                        </p>

                                        {book.genre && (
                                            <span className="library-card-genre">
                                                {book.genre
                                                    .replaceAll("_", " ")
                                                    .toLowerCase()
                                                    .replace(
                                                        /\b\w/g,
                                                        char => char.toUpperCase()
                                                    )}
                                            </span>
                                        )}

                                        {/* Pricing Block */}
                                        <div className="library-card-pricing">
                                            {hasDiscount && origPrice ? (
                                                <div className="library-price-discount-box">
                                                    <span className="library-price-orig">
                                                        {formatPrice(origPrice)}
                                                    </span>
                                                    <span className="library-price-final discounted">
                                                        {formatPrice(price)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="library-price-final">
                                                    {price != null ? formatPrice(price) : "N/A"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Loading More Spinner */}
                {loadingMore && (
                    <div className="library-loading-more">
                        <div className="library-spinner small" />
                        <p>Loading more books...</p>
                    </div>
                )}

                {/* End Of Catalog */}
                {!hasMore && books.length > 0 && (
                    <div className="library-end">
                        <span />
                        <p>You reached the end of the catalog.</p>
                        <span />
                    </div>
                )}
            </div>

            <Footer />

            {/* Mobile Bottom Navigation */}
            <div className="BottomNav">
                <nav className="bottom-navbar">
                    <Link to="/" className="nav-item">
                        <i className="fas fa-home"></i>
                        <span>Home</span>
                    </Link>
                    <Link to="/favorites" className="nav-item">
                        <i className="fa-solid fa-heart"></i>
                        <span>Favorites</span>
                    </Link>
                    <Link to="/library" className="nav-item active">
                        <i className="fa-solid fa-book"></i>
                        <span>Catalog</span>
                    </Link>
                    <Link to="/subscription" className="nav-item">
                        <i className="fa-solid fa-bolt"></i>
                        <span>Plans</span>
                    </Link>
                    <Link to="/basket" className="nav-item">
                        <i className="fa-solid fa-cart-shopping"></i>
                        <span>Cart</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}