import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";

import BookService from "../../Services/BookService";
import { queryKeys } from "../../Hooks/queries/queryKeys";
import Navbar from "../../Components/Navbar";
import BottomNav from "../../Components/common/BottomNav";
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
    //      Infinite Query
    // ============================================

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loading,
        isError,
        refetch,
    } = useInfiniteQuery({
        queryKey: queryKeys.books.list({ infinite: true }),
        queryFn: ({ pageParam = 1 }) => BookService.getBooks({ page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage?.next) {
                return allPages.length + 1;
            }
            return undefined;
        },
    });

    const books = useMemo(() => {
        if (!data?.pages) return [];
        const all = data.pages.flatMap((page) => page.results || page || []);
        const seen = new Set();
        return all.filter((book) => {
            if (seen.has(book.id)) return false;
            seen.add(book.id);
            return true;
        });
    }, [data]);

    const loadingMore = isFetchingNextPage;
    const hasMore = Boolean(hasNextPage);
    const error = isError ? "Could not load books." : "";

    // ============================================
    //      Infinite Scroll Listener
    // ============================================

    useEffect(() => {
        const handleScroll = () => {
            if (!hasNextPage || isFetchingNextPage) {
                return;
            }

            const scrollPosition =
                window.innerHeight +
                window.scrollY;

            const threshold =
                document.documentElement.scrollHeight -
                700;

            if (scrollPosition >= threshold) {
                fetchNextPage();
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
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ============================================
    //      Loading Initial
    // ============================================

    if (loading) {
        return (
            <div className="all">
                <Navbar />

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
            <Navbar />

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
                            onClick={() => refetch()}
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
            <BottomNav />
        </div>
    );
}