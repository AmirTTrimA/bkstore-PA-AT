import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BasketService from "../../Services/BasketService";
import BookService from "../../Services/BookService";
import WishlistService from "../../Services/WishlistService";
import RecommendationService from "../../Services/RecommendationService";

import Footer from "../../Components/Footer";
import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import ReusableSlider from "../../Components/common/ReusableSlider";
import Notification from "../../Components/feature/Notification";

import { useAuth } from "../../Context/AuthContext";
import { useLanguage } from "../../Context/LanguageContext";
import { formatPrice } from "../../utils/formatPrice";
import { ppic1 } from "../../Constants";

import "../../Styles/components/Book.css";

// ============================================
// Helpers
// ============================================

function getBookImage(b) {
  return (
    b.cover_image_url ||
    b.cover_image ||
    "https://placehold.co/400x600?text=No+Cover"
  );
}

function getBookPrice(b) {
  if (b.price === null || b.price === undefined || b.price === "") {
    return "N/A";
  }
  return formatPrice(b.price);
}

function mapBookForSlider(b) {
  return {
    id: b.id,
    title: b.title || "Untitled Book",
    price: getBookPrice(b),
    original_price: b.original_price ? formatPrice(b.original_price) : null,
    discount_percent: b.discount_percent || 0,
    has_discount: Boolean(b.has_discount),
    link: String(b.id),
    authorId: b.author_id || b.author?.id || 0,
    author_profile:
      b.author?.profile_image_url ||
      b.author_profile ||
      ppic1,
    img: getBookImage(b),
    match_reasons: b.match_reasons || [],
    similarity_score: b.similarity_score,
  };
}

export default function Book() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const notificationRef = useRef(null);


  // ==========================
  // State
  // ==========================

  const [book, setBook] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedFormat, setSelectedFormat] = useState(null);

  const [liked, setLiked] = useState(false);

  const [wishlistItemId, setWishlistItemId] = useState(null);

  const [addingCart, setAddingCart] = useState(false);

  const [updatingWishlist, setUpdatingWishlist] = useState(false);

  const [similarBooks, setSimilarBooks] = useState([]);


  // ==========================
  // Scroll to top on book change
  // ==========================
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [bookId]);


  // ==========================
  // Load book
  // ==========================

  useEffect(() => {

    const fetchBook = async () => {

      try {

        const data =
          await BookService.getBookById(bookId);


        setBook(data);


        if (data.formats?.length) {
          setSelectedFormat(data.formats[0]);
        }


      } catch (err) {

        console.error(err);

        setError("Could not load this book.");

      }
      finally {

        setLoading(false);

      }

    };


    fetchBook();

  }, [bookId]);


  // ==========================
  // Load similar books (Phase 3 Semantic Recommendations)
  // ==========================

  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;

    RecommendationService.getSimilarBooks(bookId, 6)
      .then((data) => {
        if (!cancelled && data?.recommendations) {
          setSimilarBooks(data.recommendations.map(mapBookForSlider));
        }
      })
      .catch((err) => {
        console.warn("Could not load similar books:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId]);


  // ==========================
  // Load wishlist state
  // ==========================

  useEffect(() => {

    if (!book || !isLoggedIn) {

      setLiked(false);
      setWishlistItemId(null);

      return;

    }


    const checkWishlist = async () => {

      try {

        const response =
          await WishlistService.getWishlist();


        const wishlist =
          response.data.results ||
          response.data ||
          [];


        const wishlistItem =
          wishlist.find(
            item =>
              item.book_id === book.id
          );


        if (wishlistItem) {

          setLiked(true);

          setWishlistItemId(
            wishlistItem.id
          );

        } else {

          setLiked(false);

          setWishlistItemId(null);

        }


      } catch (err) {

        console.error(
          "Failed loading wishlist:",
          err
        );

      }

    };


    checkWishlist();

  }, [book, isLoggedIn]);


  // ==========================
  // Favorite handler
  // ==========================

  const toggleFavorite = async () => {

    if (!isLoggedIn) {

      notificationRef.current?.showNotif(
        "Login required",
        "error",
        {
          linkText: "login",
          linkHref: "/login"
        }
      );

      return;

    }


    if (updatingWishlist)
      return;


    try {

      setUpdatingWishlist(true);


      // --------------------------
      // Remove from wishlist
      // --------------------------

      if (liked) {

        if (!wishlistItemId) {

          throw new Error(
            "Wishlist item ID is missing."
          );

        }


        await WishlistService.removeBook(
          wishlistItemId
        );


        setLiked(false);

        setWishlistItemId(null);


        notificationRef.current?.showNotif(
          "Removed from favorites",
          "success"
        );


      }

      // --------------------------
      // Add to wishlist
      // --------------------------

      else {

        await WishlistService.addBook(
          book.id
        );


        /*
         * The backend currently returns:
         *
         * {
         *   detail: "...",
         *   book_id: ...
         * }
         *
         * It does not return the newly-created
         * WishlistItem ID.
         *
         * Fetch the wishlist again so we can
         * obtain that ID for future deletion.
         */

        const response =
          await WishlistService.getWishlist();


        const wishlist =
          response.data.results ||
          response.data ||
          [];


        const wishlistItem =
          wishlist.find(
            item =>
              item.book_id === book.id
          );


        setLiked(true);

        setWishlistItemId(
          wishlistItem?.id || null
        );


        notificationRef.current?.showNotif(
          "Added to favorites",
          "success"
        );

      }


    } catch (err) {

      console.error(
        "Wishlist error:",
        err
      );


      notificationRef.current?.showNotif(
        err.response?.data?.detail ||
        "Failed to update favorites",
        "error"
      );

    } finally {

      setUpdatingWishlist(false);

    }

  };


  // ==========================
  // Add to cart
  // ==========================

  const addToCart = async () => {

    if (!selectedFormat) {

      notificationRef.current?.showNotif(
        "Please select a format",
        "error"
      );

      return;

    }


    try {

      setAddingCart(true);


      await BasketService.addItem({

        book_id: book.id,

        format_id: selectedFormat.id,

        quantity: 1

      });


      notificationRef.current?.showNotif(
        "Added to cart",
        "success"
      );


    } catch (err) {

      console.error(
        "Cart error:",
        err
      );


      notificationRef.current?.showNotif(
        err.response?.data?.detail ||
        "Failed to add item",
        "error"
      );


    } finally {

      setAddingCart(false);

    }

  };


  // ==========================
  // Author
  // ==========================

  const goAuthor = () => {

    if (book.author_id) {

      navigate(
        `/author/${book.author_id}`
      );

    }

  };


  // ==========================
  // Loading/Error
  // ==========================

  if (loading) {
    return (
      <>
        <div className="book-nav-full"><Navbar /></div>
        <div className="book-nav-res"><SimpleNav /></div>
        <div className="book-status-screen">
          <div className="book-spinner"></div>
          <p>{t("common.loading", "Loading book details...")}</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!book || error) {
    return (
      <>
        <div className="book-nav-full"><Navbar /></div>
        <div className="book-nav-res"><SimpleNav /></div>
        <div className="book-status-screen">
          <h2>{error || t("book.notFound", "Book not found")}</h2>
          <p>{t("book.notFoundDesc", "The requested book could not be found in our catalog.")}</p>
          <button className="book-back-action-btn" onClick={() => navigate("/library")}>
            ← {t("library.exploreCatalog", "Explore Book Catalog")}
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="book-nav-full">
        <Navbar />
      </div>

      <div className="book-nav-res">
        <SimpleNav />
      </div>

      <Notification ref={notificationRef} />

      <main className="book-container">
        {/* Top bar with back button & breadcrumbs */}
        <div className="book-top-bar">
          <button className="book-back-btn" onClick={() => navigate(-1)} title={t("common.back", "Go Back")}>
            <i className="fas fa-angle-left"></i> {t("common.back", "Back")}
          </button>
          <div className="book-breadcrumbs">
            <button onClick={() => navigate("/home")} className="crumb-link">{t("nav.home", "Home")}</button>
            <span className="crumb-sep">/</span>
            <button onClick={() => navigate("/library")} className="crumb-link">{t("library.bookCatalog", "Library")}</button>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{book.title}</span>
          </div>
        </div>

        <section className="main">
          {/* Main Book Card */}
          <div className="main-book">
            <div className="book-card">
              <div className="book-cover-wrapper">
                <img
                  className="bk-slide-image"
                  src={book.cover_image_url || "/default-book.png"}
                  alt={book.title}
                />
                {selectedFormat?.has_discount && (
                  <span className="book-cover-discount-badge">
                    -{selectedFormat.discount_percent}% OFF
                  </span>
                )}
              </div>

              <div className="info">
                <h1 className="bk-slide-title">{book.title}</h1>

                <div className="book-meta-tags-row">
                  {/* Author */}
                  <div className="meta-item">
                    <span className="meta-label">{t("common.author", "Author")}:</span>
                    <button id="ext" onClick={goAuthor} title={t("author.authorProfile", "View Author Profile")}>
                      {book.author_name}
                    </button>
                  </div>

                  {/* Publisher */}
                  {book.publisher_id && (
                    <div className="meta-item">
                      <span className="meta-label">{t("book.publisher", "Publisher")}:</span>
                      <button
                        className="book-publisher-badge"
                        onClick={() => navigate(`/publisher/${book.publisher_id}`)}
                        title={t("publisher.viewPublisher", "View Publisher")}
                      >
                        <i className="fas fa-building" style={{ marginRight: 5 }}></i>
                        {book.publisher_name}
                      </button>
                    </div>
                  )}

                  {/* Genre */}
                  <div className="meta-item">
                    <span className="meta-label">{t("book.genre", "Genre")}:</span>
                    <span className="book-categories-link">{book.genre}</span>
                  </div>

                  {/* Content Tone (Phase 3 Semantic Model) */}
                  {book.content_tone && (
                    <div className="meta-item">
                      <span className="meta-label">{t("book.contentTone", "Content Tone")}:</span>
                      <span className="book-meta-chip tone-chip" style={{ textTransform: "capitalize" }}>
                        {book.content_tone}
                      </span>
                    </div>
                  )}

                  {/* Target Age Group (Phase 3 Semantic Model) */}
                  {book.target_age_group && (
                    <div className="meta-item">
                      <span className="meta-label">{t("book.targetAge", "Target Audience")}:</span>
                      <span className="book-meta-chip age-chip" style={{ textTransform: "capitalize" }}>
                        {book.target_age_group}
                      </span>
                    </div>
                  )}
                </div>

                <p className="extra-info">
                  <strong>ISBN:</strong> {book.isbn}
                </p>

                {/* Wishlist Button */}
                <button
                  className={`book-favorite-btn ${liked ? "favorited" : ""}`}
                  onClick={toggleFavorite}
                  disabled={updatingWishlist}
                >
                  <i className={liked ? "fas fa-heart" : "far fa-heart"}></i>
                  <span>
                    {updatingWishlist
                      ? t("common.updating", "Updating...")
                      : liked
                      ? t("book.inWishlist", "In Wishlist (Remove)")
                      : t("book.addToWishlist", "Add to Wishlist")}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Aside: Visible Formats & Purchase */}
          <aside className="side-card">
            <div className="side-card-header">
              <h3>{t("book.availableFormats", "Available Formats")}</h3>
              <span className="format-count-tag">
                {book.formats?.length || 0} {t("book.formatsCount", "Formats")}
              </span>
            </div>

            {/* VISIBLE INTERACTIVE FORMAT SELECTION CARDS */}
            <div className="format-cards-list">
              {book.formats?.map((format) => {
                const isSelected = selectedFormat?.id === format.id;
                const isAudio = (format.type || "").toUpperCase() === "AUDIO";
                const isDigital = (format.type || "").toUpperCase() === "DIGITAL";
                const isPhysical = (format.type || "").toUpperCase() === "PHYSICAL";

                return (
                  <div
                    key={format.id}
                    className={`format-option-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedFormat(format)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="format-card-top-line">
                      <span className="format-card-icon">
                        {isPhysical && "📖"}
                        {isDigital && "📱"}
                        {isAudio && "🎧"}
                      </span>
                      <span className="format-name-text">
                        {isPhysical && t("book.physicalBook", "Physical Book")}
                        {isDigital && t("book.digitalPdf", "Digital (PDF)")}
                        {isAudio && t("book.audiobook", "Audiobook")}
                      </span>
                      {isSelected && <span className="format-check-mark">✓</span>}
                    </div>

                    <div className="format-desc-subtext">
                      {isPhysical && t("book.expressDelivery", "Express delivery to door")}
                      {isDigital && t("book.instantReading", "Instant reading on dashboard")}
                      {isAudio && t("book.highQualityAudio", "High quality audio stream")}
                    </div>

                    <div className="format-card-price-line">
                      {format.has_discount ? (
                        <>
                          <span className="format-card-orig-price">
                            {formatPrice(format.original_price)}
                          </span>
                          <span className="format-card-discount-pill">
                            -{format.discount_percent}%
                          </span>
                        </>
                      ) : null}
                      <span className="format-card-active-price">
                        {formatPrice(format.price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total price & Checkout CTA */}
            <div className="side-card-summary">
              <div className="summary-price-row">
                <span className="summary-label">{t("book.selectedPrice", "Selected Format Price:")}</span>
                <div className="summary-price-values">
                  {selectedFormat?.has_discount && (
                    <span className="summary-original-price">
                      {formatPrice(selectedFormat.original_price)}
                    </span>
                  )}
                  <span className="summary-final-price">
                    {formatPrice(selectedFormat?.price)}
                  </span>
                </div>
              </div>

              {selectedFormat?.has_discount && (
                <div className="summary-savings-note">
                  {t("book.saveDiscount", "Save {percent}% on this edition", { percent: selectedFormat.discount_percent })}
                </div>
              )}
            </div>

            <button
              className="book-buy-btn"
              onClick={addToCart}
              disabled={addingCart}
            >
              <i className="fas fa-cart-plus" style={{ marginRight: 8 }}></i>
              {addingCart ? t("cart.adding", "Adding to Cart...") : t("book.addToCart", "Add to Shopping Cart")}
            </button>
          </aside>
        </section>

        {/* Description Section */}
        <section className="book-rest">
          <div className="about-book">
            <div className="about-book-content">
              <h2>{t("book.aboutThisBook", "About this book")}</h2>
              <p>{book.description}</p>
            </div>
          </div>
        </section>

        {/* Ratings & Community Reviews Section */}
        <section className="book-reviews-section">
          <div className="reviews-container">
            <div className="reviews-header">
              <h2>{t("book.communityReviews", "Community Reviews & Ratings")}</h2>
              <div className="overall-score-badge">
                <span className="stars-gold">★★★★★</span>
                <span className="score-num">4.8</span>
                <span className="score-total">/ 5.0 ({t("book.verifiedReaders", "Verified Readers")})</span>
              </div>
            </div>

            <div className="reviews-grid">
              <div className="review-box">
                <div className="review-box-top">
                  <strong>Mohsen R.</strong>
                  <span className="review-stars">★★★★★</span>
                  <span className="verified-tag">{t("book.verifiedReader", "Verified Reader")}</span>
                </div>
                <p>
                  "A masterfully written piece with vivid imagery and deep psychological layers.
                  The digital edition is formatted perfectly."
                </p>
              </div>

              <div className="review-box">
                <div className="review-box-top">
                  <strong>Sara T.</strong>
                  <span className="review-stars">★★★★★</span>
                  <span className="verified-tag">{t("book.verifiedReader", "Verified Reader")}</span>
                </div>
                <p>
                  "The translation and footnotes are very insightful. Having instant access in my dashboard
                  was super convenient."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 3 Semantic Recommendation Showcase: Similar & Related Books */}
        {similarBooks.length > 0 && (
          <section className="book-similar-section">
            <ReusableSlider
              items={similarBooks}
              title={t("book.similarBooks", "Similar & Related Books")}
              viewAllLink="/search"
              customClass="home-popular"
              cardWidth="280px"
            />
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}