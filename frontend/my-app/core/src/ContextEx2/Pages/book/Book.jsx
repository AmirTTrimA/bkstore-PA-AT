import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BasketService from "../../Services/BasketService";
import BookService from "../../Services/BookService";
import WishlistService from "../../Services/WishlistService";

import Footer from "../../Components/Footer";
import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import Notification from "../../Components/feature/Notification";

import { useAuth } from "../../Context/AuthContext";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Book.css";


export default function Book() {

  const { bookId } = useParams();
  const navigate = useNavigate();

  const { isLoggedIn } = useAuth();

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
          <p>Loading book details...</p>
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
          <h2>{error || "Book not found"}</h2>
          <p>The requested book could not be found in our catalog.</p>
          <button className="book-back-action-btn" onClick={() => navigate("/library")}>
            ← Explore Book Catalog
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
          <button className="book-back-btn" onClick={() => navigate(-1)} title="Go Back">
            <i className="fas fa-angle-left"></i> Back
          </button>
          <div className="book-breadcrumbs">
            <button onClick={() => navigate("/home")} className="crumb-link">Home</button>
            <span className="crumb-sep">/</span>
            <button onClick={() => navigate("/library")} className="crumb-link">Library</button>
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
                    <span className="meta-label">Author:</span>
                    <button id="ext" onClick={goAuthor} title="View Author Profile">
                      {book.author_name}
                    </button>
                  </div>

                  {/* Publisher */}
                  {book.publisher_id && (
                    <div className="meta-item">
                      <span className="meta-label">Publisher:</span>
                      <button
                        className="book-publisher-badge"
                        onClick={() => navigate(`/publisher/${book.publisher_id}`)}
                        title="View Publisher"
                      >
                        <i className="fas fa-building" style={{ marginRight: 5 }}></i>
                        {book.publisher_name}
                      </button>
                    </div>
                  )}

                  {/* Genre */}
                  <div className="meta-item">
                    <span className="meta-label">Genre:</span>
                    <span className="book-categories-link">{book.genre}</span>
                  </div>
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
                      ? "Updating..."
                      : liked
                      ? "In Wishlist (Remove)"
                      : "Add to Wishlist"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Aside: Visible Formats & Purchase */}
          <aside className="side-card">
            <div className="side-card-header">
              <h3>Available Formats</h3>
              <span className="format-count-tag">
                {book.formats?.length || 0} {book.formats?.length === 1 ? "Format" : "Formats"}
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
                        {isPhysical && "Physical Book"}
                        {isDigital && "Digital (PDF)"}
                        {isAudio && "Audiobook"}
                      </span>
                      {isSelected && <span className="format-check-mark">✓</span>}
                    </div>

                    <div className="format-desc-subtext">
                      {isPhysical && "Express delivery to door"}
                      {isDigital && "Instant reading on dashboard"}
                      {isAudio && "High quality audio stream"}
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
                <span className="summary-label">Selected Format Price:</span>
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
                  Save {selectedFormat.discount_percent}% on this edition
                </div>
              )}
            </div>

            <button
              className="book-buy-btn"
              onClick={addToCart}
              disabled={addingCart}
            >
              <i className="fas fa-cart-plus" style={{ marginRight: 8 }}></i>
              {addingCart ? "Adding to Cart..." : "Add to Shopping Cart"}
            </button>
          </aside>
        </section>

        {/* Description Section */}
        <section className="book-rest">
          <div className="about-book">
            <div className="about-book-content">
              <h2>About this book</h2>
              <p>{book.description}</p>
            </div>
          </div>
        </section>

        {/* Ratings & Community Reviews Section */}
        <section className="book-reviews-section">
          <div className="reviews-container">
            <div className="reviews-header">
              <h2>Community Reviews & Ratings</h2>
              <div className="overall-score-badge">
                <span className="stars-gold">★★★★★</span>
                <span className="score-num">4.8</span>
                <span className="score-total">/ 5.0 (Verified Readers)</span>
              </div>
            </div>

            <div className="reviews-grid">
              <div className="review-box">
                <div className="review-box-top">
                  <strong>Mohsen R.</strong>
                  <span className="review-stars">★★★★★</span>
                  <span className="verified-tag">Verified Reader</span>
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
                  <span className="verified-tag">Verified Reader</span>
                </div>
                <p>
                  "The translation and footnotes are very insightful. Having instant access in my dashboard
                  was super convenient."
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}