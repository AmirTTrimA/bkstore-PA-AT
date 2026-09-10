import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

import Addresses from "./addresses/Addresses";
import Financial from "./financial/Financial";
import Profile from "./profile/Profile";
import FavoritesView from "./views/FavoritesView";
import SubscriptionView from "./views/SubscriptionView";
import { ThemeToggle } from "../../Components/common/ThemeToggle";
import { LanguageToggle } from "../../Components/common/LanguageToggle";
import { useLanguage } from "../../Context/LanguageContext";
import { ppic14 } from "../../Constants";
import ContentService from "../../Services/ContentService";
import UserService from "../../Services/UserService";

import "../../Styles/components/Dashboard.css";

const SEARCH_MIN_LENGTH = 2;
const HIGHLIGHT_DURATION = 4000;

export default function Dashboard({ initialTab }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine active view from URL query param `?tab=...` or initialTab prop
  const currentTabParam = searchParams.get("tab") || initialTab || "library";
  const [activeView, setActiveView] = useState(currentTabParam);

  // Sync state if URL search param changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["library", "favorites", "subscription", "addresses"].includes(tab)) {
      setActiveView(tab);
    }
  }, [searchParams]);

  // Tab switch handler with URL query sync
  const switchTab = useCallback(
    (newTab) => {
      setActiveView(newTab);
      setSearchParams({ tab: newTab });
    },
    [setSearchParams]
  );

  // Refs
  const inputRef = useRef(null);
  const rowRefs = useRef({});
  const asideRef = useRef(null);

  // State
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState("");

  const [profileData, setProfileData] = useState(null);

  // Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [financialDefaultTab, setFinancialDefaultTab] = useState(0);

  // Mobile drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Highlight (for library shelf)
  const [searchInputValue, setSearchInputValue] = useState("");
  const [selectedRowId, setSelectedRowId] = useState(null);

  // User avatar state (synced with localStorage & custom event)
  const [currentAvatar, setCurrentAvatar] = useState(
    localStorage.getItem("user_avatar") || ppic14
  );

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setCurrentAvatar(localStorage.getItem("user_avatar") || ppic14);
    };
    window.addEventListener("avatar_updated", handleAvatarUpdate);
    return () => window.removeEventListener("avatar_updated", handleAvatarUpdate);
  }, []);

  const username =
    profileData?.first_name ||
    user?.first_name ||
    profileData?.username ||
    user?.username ||
    "Reader";

  // Filtered books based on search input
  const displayedBooks =
    searchInputValue.trim().length >= SEARCH_MIN_LENGTH
      ? libraryBooks.filter((book) => {
          const query = searchInputValue.trim().toLowerCase();
          const titleMatch = book.book_title?.toLowerCase().includes(query);
          const formatMatch = book.format_name?.toLowerCase().includes(query);
          const typeMatch = book.format_type?.toLowerCase().includes(query);
          return titleMatch || formatMatch || typeMatch;
        })
      : libraryBooks;

  // Load Library Data
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLibraryLoading(true);
        setLibraryError("");

        const response = await ContentService.getLicenses();
        const licenses = response.data?.results || response.data || [];

        setLibraryBooks(
          licenses.filter(
            (license) =>
              license.format_type === "DIGITAL" ||
              license.format_type === "AUDIO" ||
              license.format_type === "PHYSICAL"
          )
        );
      } catch (error) {
        console.error("Failed to load user library:", error);
        setLibraryError("Could not load your library data. Please try again.");
      } finally {
        setLibraryLoading(false);
      }
    };

    loadLibrary();
  }, []);

  // Load User Profile Data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await UserService.getProfile();
        setProfileData(response.data);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadProfile();
  }, []);

  // Clear row highlight after duration
  useEffect(() => {
    if (selectedRowId) {
      const timer = setTimeout(() => {
        setSelectedRowId(null);
      }, HIGHLIGHT_DURATION);

      return () => clearTimeout(timer);
    }
  }, [selectedRowId]);

  // Handlers
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const handleOpenFinancial = useCallback((tabIndex = 0) => {
    setFinancialDefaultTab(tabIndex);
    setFinancialModalOpen(true);
    setMobileMenuOpen(false);
  }, []);

  const handleOpenProfile = useCallback(() => {
    setProfileModalOpen(true);
    setMobileMenuOpen(false);
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchInputValue(e.target.value || "");
    setSelectedRowId(null);
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (
        e.key === "Enter" &&
        searchInputValue.trim().length >= SEARCH_MIN_LENGTH
      ) {
        const query = searchInputValue.trim().toLowerCase();
        const foundBook = libraryBooks.find((book) => {
          const titleMatch = book.book_title?.toLowerCase().includes(query);
          const formatMatch = book.format_name?.toLowerCase().includes(query);
          return titleMatch || formatMatch;
        });

        if (foundBook) {
          setSelectedRowId(foundBook.id);
          setTimeout(() => {
            const rowElement = rowRefs.current[foundBook.id];
            if (rowElement) {
              rowElement.scrollIntoView({
                behavior: "smooth",
                block: "center"
              });
            }
          }, 100);
        }
      }
    },
    [searchInputValue, libraryBooks]
  );

  const openReader = useCallback(
    (book) => {
      const bookId = book.book_id || book.id;
      navigate(bookId ? `/pdf/${bookId}` : "/pdfreader", { state: { book } });
    },
    [navigate]
  );

  const openAudioPlayer = useCallback(
    (book) => {
      const bookId = book.book_id || book.id;
      navigate(bookId ? `/audio/${bookId}` : "/audioplayer", { state: { book } });
    },
    [navigate]
  );

  return (
    <div className="dashboard-wrapper">
      {/* Site-Wide Aligned Top Navigation Bar */}
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-inner">
          {/* Brand Logo & User Greeting */}
          <div className="topbar-left-group">
            <Link to="/home" className="nav-logo dashboard-logo" title="Back to Home">
              <span className="brand-dot">●</span> {t('nav.brandName', 'Bookkadeh')}
            </Link>

          <div
            className="topbar-user-section"
            onClick={handleOpenProfile}
            title="Edit Profile & Security Settings"
          >
            <div className="user-avatar-container">
              <img src={currentAvatar} alt="User Avatar" className="topbar-avatar" />
              <span className="avatar-edit-badge">✏️</span>
            </div>
            <div className="user-info-text">
              <h2 className="user-greeting">Hi, {username}</h2>
              <span className="user-profile-label">My Account</span>
            </div>
          </div>
        </div>

        {/* Central Search Bar (when browsing library shelf) */}
        {activeView === "library" && (
          <div className="topbar-search-section">
            <div className="search-input-wrapper">
              <svg
                className="search-svg-icon"
                xmlns="http://www.w3.org/2000/svg"
                height="18"
                viewBox="0 0 24 24"
                width="18"
                fill="currentColor"
              >
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                type="text"
                className="topbar-search-input"
                placeholder="Search shelf by title, format..."
                ref={inputRef}
                value={searchInputValue}
                onChange={handleSearch}
                onKeyDown={handleKeyPress}
              />
              {searchInputValue && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchInputValue("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Unified Dashboard Navigation Actions */}
        <nav className="topbar-nav-actions">
          {/* My Shelf View */}
          <button
            type="button"
            className={`topbar-nav-pill ${activeView === "library" ? "active" : ""}`}
            onClick={() => switchTab("library")}
          >
            📚 {t('dashboard.digitalBookshelf', 'My Shelf')}
          </button>

          {/* Favorites View */}
          <button
            type="button"
            className={`topbar-nav-pill ${activeView === "favorites" ? "active" : ""}`}
            onClick={() => switchTab("favorites")}
          >
            ⭐️ {t('nav.wishlist', 'Favorites')}
          </button>

          {/* VIP Plans View */}
          <button
            type="button"
            className={`topbar-nav-pill ${activeView === "subscription" ? "active" : ""}`}
            onClick={() => switchTab("subscription")}
          >
            💎 {t('dashboard.subscription', 'VIP Plans')}
          </button>

          {/* Addresses View */}
          <button
            type="button"
            className={`topbar-nav-pill ${activeView === "addresses" ? "active" : ""}`}
            onClick={() => switchTab("addresses")}
          >
            📍 {t('dashboard.savedAddresses', 'Addresses')}
          </button>

          {/* Financial Hub Button */}
          <button
            type="button"
            className="topbar-nav-pill"
            onClick={() => handleOpenFinancial(0)}
            title="Wallet, Orders & Transactions"
          >
            💳 {t('dashboard.wallet', 'Financial')}
          </button>

          {/* Cart Direct Route */}
          <button
            type="button"
            className="topbar-icon-btn cart-btn"
            onClick={() => navigate("/basket")}
            title="Go to Cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="currentColor"
            >
              <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z" />
            </svg>
          </button>

          {/* Language Toggle */}
          <LanguageToggle page="dash" />

          {/* Dark Mode Toggle */}
          <ThemeToggle page="dash" />

          {/* Logout Button */}
          <button
            type="button"
            className="topbar-icon-btn logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="currentColor"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
            </svg>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="currentColor"
            >
              <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
            </svg>
          </button>
        </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="dashboard-content-area">
        {/* Navigation Breadcrumb / Store Link */}
        <div className="dashboard-breadcrumb-row">
          <Link to="/home" className="store-return-link">
            ← Return to Storefront
          </Link>
          {activeView !== "library" && (
            <button
              type="button"
              className="breadcrumb-switch-btn"
              onClick={() => switchTab("library")}
            >
              📚 Back to My Shelf
            </button>
          )}
        </div>

        {/* View 1: My Shelf (Purchased & Licensed Content) */}
        {activeView === "library" && (
          <section className="library-table-section">
            <div className="section-header-row">
              <div>
                <h3 className="section-title">My Owned Books & Content</h3>
                <p className="section-subtitle">
                  All digital books, audiobooks, and physical orders linked to your account.
                </p>
              </div>
              <Link to="/library" className="catalog-link-btn">
                Browse Full Catalog →
              </Link>
            </div>

            {libraryLoading && (
              <div className="dashboard-loading-state">
                <div className="dash-spinner"></div>
                <p>Loading your bookshelf...</p>
              </div>
            )}

            {!libraryLoading && libraryError && (
              <div className="dashboard-error-state">
                <p>{libraryError}</p>
              </div>
            )}

            {!libraryLoading && !libraryError && displayedBooks.length === 0 && (
              <div className="dashboard-empty-state">
                <p className="empty-title">
                  {searchInputValue
                    ? "No books matched your search criteria."
                    : "Your digital shelf is currently empty."}
                </p>
                <p className="empty-sub">
                  {searchInputValue
                    ? "Try searching for a different book title or format."
                    : "Discover thousands of bestselling titles, audiobooks, and e-books."}
                </p>
                <Link to="/library" className="explore-catalog-btn">
                  Explore Book Catalog
                </Link>
              </div>
            )}

            {!libraryLoading && !libraryError && displayedBooks.length > 0 && (
              <div className="table-responsive-container">
                <table className="licensed-books-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Format</th>
                      <th>License Status</th>
                      <th className="th-action">Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedBooks.map((book) => {
                      const isAudio = book.format_type === "AUDIO";
                      const isPhysical = book.format_type === "PHYSICAL";
                      const isValid = Boolean(
                        book.is_valid !== false && book.is_active !== false
                      );

                      return (
                        <tr
                          key={book.id}
                          ref={(el) => {
                            rowRefs.current[book.id] = el;
                          }}
                          className={selectedRowId === book.id ? "highlighted-row" : ""}
                        >
                          <td className="td-book-title">
                            <strong>{book.book_title}</strong>
                          </td>

                          <td className="td-book-format">
                            <span
                              className={`format-pill ${
                                isAudio
                                  ? "pill-audio"
                                  : isPhysical
                                  ? "pill-physical"
                                  : "pill-digital"
                              }`}
                            >
                              {book.format_name ||
                                (isAudio
                                  ? "🎧 Audiobook"
                                  : isPhysical
                                  ? "📦 Physical Copy"
                                  : "📄 Digital (PDF)")}
                            </span>
                          </td>

                          <td className="td-book-status">
                            <span
                              className={`status-pill ${
                                isValid ? "status-valid" : "status-expired"
                              }`}
                            >
                              {isValid ? "Active" : "Expired"}
                            </span>
                          </td>

                          <td className="td-book-action">
                            {isValid ? (
                              isAudio ? (
                                <button
                                  type="button"
                                  className="book-action-btn action-audio"
                                  onClick={() => openAudioPlayer(book)}
                                  title="Play Audiobook"
                                >
                                  🎧 LISTEN
                                </button>
                              ) : isPhysical ? (
                                <button
                                  type="button"
                                  className="book-action-btn action-physical"
                                  onClick={() => handleOpenFinancial(1)}
                                  title="View Order Details"
                                >
                                  📦 VIEW ORDER
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="book-action-btn action-read"
                                  onClick={() => openReader(book)}
                                  title="Open PDF Reader"
                                >
                                  📖 READ
                                </button>
                              )
                            ) : (
                              <button
                                type="button"
                                className="book-action-btn action-disabled"
                                disabled
                              >
                                EXPIRED
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* View 2: Favorites / Wishlist */}
        {activeView === "favorites" && (
          <section className="favorites-view-section">
            <FavoritesView />
          </section>
        )}

        {/* View 3: VIP Subscription Plans */}
        {activeView === "subscription" && (
          <section className="subscription-view-section">
            <SubscriptionView />
          </section>
        )}

        {/* View 4: Saved Addresses */}
        {activeView === "addresses" && (
          <section className="addresses-view-section">
            <Addresses />
          </section>
        )}
      </main>

      {/* Mobile Slide-out Drawer */}
      <div
        className={`mobile-drawer-overlay ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`mobile-drawer-panel ${mobileMenuOpen ? "open" : ""}`}
          ref={asideRef}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawer-header">
            <div className="drawer-user-info" onClick={handleOpenProfile}>
              <img src={currentAvatar} alt="Profile" className="drawer-avatar" />
              <div>
                <h4 className="drawer-username">{username}</h4>
                <span className="drawer-role">Reader Account</span>
              </div>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✕
            </button>
          </div>

          <ul className="drawer-nav-list">
            <li>
              <button
                type="button"
                className={`drawer-link ${activeView === "library" ? "active" : ""}`}
                onClick={() => {
                  switchTab("library");
                  setMobileMenuOpen(false);
                }}
              >
                📚 My Shelf
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`drawer-link ${activeView === "favorites" ? "active" : ""}`}
                onClick={() => {
                  switchTab("favorites");
                  setMobileMenuOpen(false);
                }}
              >
                ⭐️ My Favorites
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`drawer-link ${activeView === "subscription" ? "active" : ""}`}
                onClick={() => {
                  switchTab("subscription");
                  setMobileMenuOpen(false);
                }}
              >
                💎 VIP Subscription Plans
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`drawer-link ${activeView === "addresses" ? "active" : ""}`}
                onClick={() => {
                  switchTab("addresses");
                  setMobileMenuOpen(false);
                }}
              >
                📍 Saved Addresses
              </button>
            </li>
            <li>
              <button
                type="button"
                className="drawer-link"
                onClick={() => handleOpenFinancial(0)}
              >
                💳 Financial Hub (Wallet & Orders)
              </button>
            </li>
            <li>
              <button
                type="button"
                className="drawer-link"
                onClick={handleOpenProfile}
              >
                ⚙️ Profile & Security
              </button>
            </li>
            <li>
              <Link
                to="/basket"
                className="drawer-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                🛒 Shopping Cart
              </Link>
            </li>
            <li className="drawer-divider"></li>
            <li>
              <button
                type="button"
                className="drawer-link drawer-logout"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      {profileModalOpen && (
        <Profile
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          profileData={profileData}
          onProfileUpdated={(updated) => setProfileData(updated)}
        />
      )}

      {financialModalOpen && (
        <Financial
          open={financialModalOpen}
          onClose={() => setFinancialModalOpen(false)}
          defaultTab={financialDefaultTab}
        />
      )}
    </div>
  );
}