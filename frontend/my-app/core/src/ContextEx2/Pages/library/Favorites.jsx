import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";

import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import Footer from "../../Components/Footer";
import { useAuth } from "../../Context/AuthContext";
import WishlistService from "../../Services/WishlistService";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Favorites.css";

// ============================================
//      Main Component
// ============================================

export default function Favorites() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    // ============================================
    //      State
    // ============================================

    const [favItems, setFavItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [clearing, setClearing] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    // ============================================
    //      Load Wishlist
    // ============================================

    const loadFavorites = useCallback(async () => {
        try {
            setError("");
            const response = await WishlistService.getWishlist();
            const items = response.data?.results || response.data || [];
            setFavItems(Array.isArray(items) ? items : []);
        } catch (err) {
            console.error("Failed loading wishlist:", err);
            setError("Could not load favorites.");
        } finally {
            setLoading(false);
        }
    }, []);

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
            await WishlistService.removeBook(itemId);
            setFavItems(prev => prev.filter(item => item.id !== itemId));
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

        if (!window.confirm("Are you sure you want to clear all your favorites?")) {
            return;
        }

        setClearing(true);

        try {
            await Promise.all(
                favItems.map(item => WishlistService.removeBook(item.id))
            );
            setFavItems([]);
        } catch (err) {
            console.error("Failed clearing wishlist:", err);
            setError("Could not clear favorites.");
        } finally {
            setClearing(false);
        }
    };

    // ============================================
    //      Effects
    // ============================================

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

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
            {/* Desktop Navigation */}
            <div className="full-fav-nav">
                <Navbar />
            </div>

            {/* Mobile Navigation */}
            <div className="fav-nav">
                <SimpleNav />
            </div>

            <div className="fav-container">
                {/* Top Bar with Back Button, Breadcrumbs, and Clear All */}
                <div className="favorites-top-bar">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="favorites-back-btn"
                        title="Go Back"
                    >
                        ← Back
                    </button>

                    <div className="favorites-breadcrumbs">
                        <Link to="/home">Home</Link>
                        <span>/</span>
                        <span className="current">Favorites</span>
                    </div>

                    {!isEmpty && (
                        <button
                            type="button"
                            onClick={clearFavorites}
                            className="clear-all-fav-btn"
                            disabled={clearing}
                            title="Clear all favorites"
                        >
                            <i className="fas fa-trash-alt"></i>
                            <span>{clearing ? "Clearing..." : "Clear All"}</span>
                        </button>
                    )}
                </div>

                {/* Header */}
                <div className="favorites-header-section">
                    <h1 className="favorites-page-title">My Wishlist</h1>
                    {!loading && !isEmpty && (
                        <span className="favorites-count-badge">
                            {favItems.length} {favItems.length === 1 ? "book" : "books"}
                        </span>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="favorites-state-box">
                        <div className="favorites-spinner" />
                        <p>Loading your saved books...</p>
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
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && isEmpty && (
                    <div className="favorites-empty-state">
                        <div className="favorites-empty-icon">
                            <i className="fa-regular fa-heart"></i>
                        </div>
                        <h2>Your wishlist is empty</h2>
                        <p>Explore our catalog to discover and save books you love.</p>
                        <button
                            type="button"
                            onClick={() => navigate("/library")}
                            className="favorites-cta-btn"
                        >
                            Explore Catalog
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
                                                {item.author_name || "Unknown Author"}
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
                                                        {price != null ? formatPrice(price) : "View Book"}
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
            <div className="BottomNav">
                <nav className="bottom-navbar">
                    <Link to="/" className="nav-item">
                        <i className="fas fa-home"></i>
                        <span>Home</span>
                    </Link>
                    <Link to="/favorites" className="nav-item active">
                        <i className="fa-solid fa-heart"></i>
                        <span>Favorites</span>
                    </Link>
                    <Link to="/library" className="nav-item">
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