import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import BookService from "../../Services/BookService";
import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import Footer from "../../Components/Footer";
import { useLanguage } from "../../Context/LanguageContext";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Library.css";

// ============================================
//      Main
// ============================================

export default function Library() {
    const navigate = useNavigate();
    const { t } = useLanguage();

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
                        title={t("common.back", "Go Back")}
                    >
                        ← {t("common.back", "Back")}
                    </button>
                    <div className="library-breadcrumbs">
                        <Link to="/home">{t("nav.home", "Home")}</Link>
                        <span>/</span>
                        <span className="current">{t("library.bookCatalog", "Book Catalog")}</span>
                    </div>
                </div>

                {/* Header */}
                <div className="head">
                    <p className="head-txt">
                        {t("library.exploreCatalog", "Explore Catalog")}
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
                            {t("common.retry", "Retry")}
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!error && books.length === 0 && (
                    <div className="library-message">
                        <h2>{t("library.noBooksFound", "No books found")}</h2>
                        <p>{t("library.noBooksDesc", "There are no books available in the catalog yet.")}</p>
                    </div>
                )}

                {/* Books Grid */}
                {books.length > 0 && (
                    <div className="explore">
                        {books.map(book => {
                            const formats = book.formats || [];

                            // Check available formats for cover badges and chip row
                            const hasPhysical = formats.some(f => (f.type || f.format) === "PHYSICAL");
                            const hasDigital = Boolean(book.is_digital || formats.some(f => (f.type || f.format) === "DIGITAL" || f.is_digital));
                            const hasAudio = Boolean(book.is_audio || formats.some(f => (f.type || f.format) === "AUDIO" || f.is_audio));
                            const showCoverFormats = hasPhysical || hasDigital || hasAudio;

                            // Discount info (checks book-level or format-level discounts)
                            const hasDiscount = Boolean(book.has_discount || book.has_any_discount);
                            const discountPercent = book.discount_percent || book.max_discount_percent || 0;
                            const price = book.price;
                            const origPrice = book.original_price;

                            // Format corresponding to the displayed starting price
                            const priceFormatType = book.price_format || (formats.length > 0 ? (formats.find(f => String(f.price) === String(price)) || formats[0])?.type : null);
                            
                            const getFormatDisplay = (type) => {
                                const upper = (type || "").toUpperCase();
                                if (upper === "DIGITAL") {
                                    return { icon: "📱", label: t("book.digital", "Digital (PDF)"), short: t("book.digitalShort", "E-Book") };
                                }
                                if (upper === "AUDIO") {
                                    return { icon: "🎧", label: t("book.audio", "Audiobook"), short: t("book.audioShort", "Audio") };
                                }
                                if (upper === "PHYSICAL") {
                                    return { icon: "📖", label: t("book.physical", "Physical Book"), short: t("book.physicalShort", "Print") };
                                }
                                return { icon: "📚", label: upper || t("common.book", "Book"), short: upper };
                            };

                            const priceFormatDisplay = priceFormatType ? getFormatDisplay(priceFormatType) : null;

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
                                        {showCoverFormats && (
                                            <div className="library-card-formats-badges">
                                                {hasPhysical && (
                                                    <span title={t("book.physical", "Physical Book available")}>📖</span>
                                                )}
                                                {hasDigital && (
                                                    <span title={t("book.digital", "Digital PDF available")}>📱</span>
                                                )}
                                                {hasAudio && (
                                                    <span title={t("book.audio", "Audiobook available")}>🎧</span>
                                                )}
                                            </div>
                                        )}
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
                                                t("book.unknownAuthor", "Unknown Author")}
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

                                        {/* Formats Availability Chips */}
                                        {formats.length > 0 && (
                                            <div className="library-card-available-formats">
                                                {formats.map(f => {
                                                    const fType = f.type || f.format;
                                                    const fInfo = getFormatDisplay(fType);
                                                    const isPriceFormat = fType === priceFormatType;
                                                    return (
                                                        <span
                                                            key={f.id || fType}
                                                            className={`library-format-chip ${isPriceFormat ? 'primary' : ''} ${f.has_discount ? 'discounted' : ''}`}
                                                            title={`${fInfo.label}: ${formatPrice(f.price)}`}
                                                        >
                                                            {fInfo.icon} {fInfo.short}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Pricing Block */}
                                        <div className="library-card-pricing">
                                            <div className="library-price-meta-line">
                                                <span className="library-price-from-label">
                                                    {t("book.startsFrom", "From")}
                                                </span>
                                                {priceFormatDisplay && (
                                                    <span className={`library-price-format-pill ${(priceFormatType || '').toLowerCase()}`}>
                                                        {priceFormatDisplay.icon} {priceFormatDisplay.label}
                                                    </span>
                                                )}
                                            </div>

                                            {hasDiscount && origPrice ? (
                                                <div className="library-price-discount-box">
                                                    <span className="library-price-orig">
                                                        {formatPrice(origPrice)}
                                                    </span>
                                                    <span className="library-price-final discounted">
                                                        {formatPrice(price)}
                                                    </span>
                                                    {discountPercent > 0 && (
                                                        <span className="library-price-discount-tag">
                                                            -{discountPercent}%
                                                        </span>
                                                    )}
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
                        <p>{t("common.loading", "Loading more books...")}</p>
                    </div>
                )}

                {/* End Of Catalog */}
                {!hasMore && books.length > 0 && (
                    <div className="library-end">
                        <span />
                        <p>{t("library.endOfCatalog", "You reached the end of the catalog.")}</p>
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
                        <span>{t("nav.home", "Home")}</span>
                    </Link>
                    <Link to="/favorites" className="nav-item">
                        <i className="fa-solid fa-heart"></i>
                        <span>{t("library.favorites", "Favorites")}</span>
                    </Link>
                    <Link to="/library" className="nav-item active">
                        <i className="fa-solid fa-book"></i>
                        <span>{t("nav.explore", "Catalog")}</span>
                    </Link>
                    <Link to="/subscription" className="nav-item">
                        <i className="fa-solid fa-bolt"></i>
                        <span>{t("nav.subscription", "Plans")}</span>
                    </Link>
                    <Link to="/basket" className="nav-item">
                        <i className="fa-solid fa-cart-shopping"></i>
                        <span>{t("nav.cart", "Cart")}</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}