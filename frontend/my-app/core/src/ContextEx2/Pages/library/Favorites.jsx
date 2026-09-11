import { useState, useMemo } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";

import Navbar from "../../Components/Navbar";
import BottomNav from "../../Components/common/BottomNav";
import Footer from "../../Components/Footer";
import { useAuth } from "../../Context/AuthContext";
import { useLanguage } from "../../Context/LanguageContext";
import { useWishlist, useRemoveFromWishlist } from "../../Hooks/queries";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Favorites.css";

// ============================================
//      Main Component
// ============================================

export default function Favorites() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const { t } = useLanguage();

    // ============================================
    //      Queries & Mutations via React Query
    // ============================================

    const { data: wishlistData, isLoading: loading, error: wishlistErr, refetch: loadFavorites } = useWishlist({ enabled: Boolean(isLoggedIn) });
    const removeMutation = useRemoveFromWishlist();

    const favItems = useMemo(() => {
        const items = wishlistData?.results || (Array.isArray(wishlistData) ? wishlistData : []);
        return items;
    }, [wishlistData]);

    const error = wishlistErr ? "Could not load favorites." : "";
    const [clearing, setClearing] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    // ============================================
    //      Remove Single Item
    // ============================================

    const handleRemoveSingle = async (itemId, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (removingId) return;

        setRemovingId(itemId);
        try {
            await removeMutation.mutateAsync(itemId);
        } catch (err) {
            console.error("Failed removing item from favorites:", err);
        } finally {
            setRemovingId(null);
        }
    };

    // ============================================
    //      Remove All
    // ============================================

    const clearFavorites = async () => {
        if (clearing || favItems.length === 0) {
            return;
        }

        if (!window.confirm(t("library.confirmClearWishlist", "Are you sure you want to clear all your favorites?"))) {
            return;
        }

        setClearing(true);

        try {
            await Promise.all(
                favItems.map(item => removeMutation.mutateAsync(item.id))
            );
        } catch (err) {
            console.error("Failed clearing wishlist:", err);
        } finally {
            setClearing(false);
        }
    };

    // ============================================
    //      Derived State
    // ============================================

    const isEmpty = favItems.length === 0;

    // ============================================
    //      Render
    // ============================================

    if (isLoggedIn) {
        return <Navigate to="/dashboard?tab=favorites" replace />;
    }

    return (
        <div className="favorites-page-root">
            <Navbar />

            <div className="fav-container">
                {/* Top Bar with Back Button, Breadcrumbs, and Clear All */}
                <div className="favorites-top-bar">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="favorites-back-btn"
                        title={t("common.back", "Go Back")}
                    >
                        ← {t("common.back", "Back")}
                    </button>

                    <div className="favorites-breadcrumbs">
                        <Link to="/home">{t("nav.home", "Home")}</Link>
                        <span>/</span>
                        <span className="current">{t("library.favorites", "Favorites")}</span>
                    </div>

                    {!isEmpty && (
                        <button
                            type="button"
                            onClick={clearFavorites}
                            className="clear-all-fav-btn"
                            disabled={clearing}
                            title={t("library.clearAll", "Clear All")}
                        >
                            <i className="fas fa-trash-alt"></i>
                            <span>{clearing ? t("library.clearing", "Clearing...") : t("library.clearAll", "Clear All")}</span>
                        </button>
                    )}
                </div>

                {/* Header */}
                <div className="favorites-header-section">
                    <h1 className="favorites-page-title">{t("library.wishlistTitle", "My Wishlist")}</h1>
                    {!loading && !isEmpty && (
                        <span className="favorites-count-badge">
                            {favItems.length} {t("library.bookCount", favItems.length === 1 ? "book" : "books", { count: favItems.length })}
                        </span>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="favorites-state-box">
                        <div className="favorites-spinner" />
                        <p>{t("common.loading", "Loading your saved books...")}</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="favorites-state-box favorites-error">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={loadFavorites}
                            className="favorites-cta-btn"
                        >
                            {t("common.retry", "Try Again")}
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && isEmpty && (
                    <div className="favorites-empty-state">
                        <div className="favorites-empty-icon">
                            <i className="fa-regular fa-heart"></i>
                        </div>
                        <h2>{t("library.emptyWishlist", "Your wishlist is empty")}</h2>
                        <p>{t("library.emptyWishlistDesc", "Explore our catalog to discover and save books you love.")}</p>
                        <button
                            type="button"
                            onClick={() => navigate("/library")}
                            className="favorites-cta-btn"
                        >
                            {t("library.exploreCatalog", "Explore Catalog")}
                        </button>
                    </div>
                )}

                {/* Favorites Grid */}
                {!loading && !error && !isEmpty && (
                    <div className="favorites-grid">
                        {favItems.map(item => {
                            const hasDiscount = Boolean(item.has_discount);
                            const discountPercent = item.discount_percent || 0;
                            const price = item.price;
                            const origPrice = item.original_price;

                            return (
                                <div key={item.id} className="fav-book-card">
                                    {/* Single Item Remove Button */}
                                    <button
                                        type="button"
                                        className="fav-remove-single-btn"
                                        onClick={(e) => handleRemoveSingle(item.id, e)}
                                        disabled={removingId === item.id}
                                        title="Remove from favorites"
                                    >
                                        {removingId === item.id ? (
                                            <i className="fas fa-circle-notch fa-spin"></i>
                                        ) : (
                                            <i className="fas fa-trash-alt"></i>
                                        )}
                                    </button>

                                    <Link
                                        to={`/book/${item.book_id}`}
                                        className="fav-book-card-link"
                                    >
                                        <div className="fav-card-cover">
                                            {hasDiscount && discountPercent > 0 && (
                                                <span className="fav-card-discount-badge">
                                                    -{discountPercent}%
                                                </span>
                                            )}
                                            <img
                                                src={item.cover_image_url || "/default-book.png"}
                                                alt={item.title}
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "/default-book.png";
                                                }}
                                            />
                                        </div>

                                        <div className="fav-card-info">
                                            <h3 className="fav-card-title" title={item.title}>
                                                {item.title}
                                            </h3>
                                            <p className="fav-card-author">
                                                {item.author_name || t("book.unknownAuthor", "Unknown Author")}
                                            </p>

                                            <div className="fav-card-pricing">
                                                {hasDiscount && origPrice ? (
                                                    <div className="fav-price-box">
                                                        <span className="fav-price-orig">
                                                            {formatPrice(origPrice)}
                                                        </span>
                                                        <span className="fav-price-final discounted">
                                                            {formatPrice(price)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="fav-price-final">
                                                        {price != null ? formatPrice(price) : t("library.viewBook", "View Book")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
}