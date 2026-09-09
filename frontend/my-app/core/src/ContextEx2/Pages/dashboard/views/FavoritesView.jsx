import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../Context/LanguageContext";
import WishlistService from "../../../Services/WishlistService";
import { formatPrice } from "../../../utils/formatPrice";

import "../../../Styles/components/Favorites.css";

export default function FavoritesView() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [favItems, setFavItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemoveSingle = async (itemId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (removingId) return;

    setRemovingId(itemId);
    try {
      await WishlistService.removeBook(itemId);
      setFavItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Failed removing item from favorites:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const clearFavorites = async () => {
    if (clearing || favItems.length === 0) return;
    if (!window.confirm(t("library.confirmClearWishlist", "Are you sure you want to clear all your favorites?"))) return;

    setClearing(true);
    try {
      await Promise.all(
        favItems.map((item) => WishlistService.removeBook(item.id))
      );
      setFavItems([]);
    } catch (err) {
      console.error("Failed clearing wishlist:", err);
      setError("Could not clear favorites.");
    } finally {
      setClearing(false);
    }
  };

  const isEmpty = favItems.length === 0;

  return (
    <div className="dashboard-favorites-embed">
      <div className="favorites-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 className="favorites-page-title" style={{ margin: 0, color: "#fff", fontSize: "1.4rem", fontWeight: 700 }}>
            ⭐️ {t("library.wishlistTitle", "My Wishlist & Saved Books")}
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
            {t("library.wishlistSubtitle", "Titles you've marked as favorites for future reading and purchase.")}
          </p>
        </div>

        {!isEmpty && (
          <button
            type="button"
            onClick={clearFavorites}
            className="clear-all-fav-btn"
            disabled={clearing}
            title={t("library.clearAll", "Clear All")}
          >
            <i className="fas fa-trash-alt" style={{ marginRight: 6 }}></i>
            <span>{clearing ? t("library.clearing", "Clearing...") : t("library.clearAll", "Clear All")}</span>
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="favorites-state-box">
          <div className="favorites-spinner" />
          <p>{t("common.loading", "Loading...")}</p>
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
            {t("library.exploreCatalog", "Explore Catalog")} →
          </button>
        </div>
      )}

      {/* Favorites Grid */}
      {!loading && !error && !isEmpty && (
        <div className="favorites-grid">
          {favItems.map((item) => {
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
  );
}
