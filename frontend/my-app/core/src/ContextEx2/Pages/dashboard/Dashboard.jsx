import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";

import Basket from "../buy/Basket";
import Addresses from "./addresses/Addresses";
import Financial from "./financial/Financial";
import Profile from "./profile/Profile";

import { ThemeToggle } from "../../Components/common/ThemeToggle";

import { ppic14 } from "../../Constants";
import ContentService from "../../Services/ContentService";
import UserService from "../../Services/UserService";

import "../../Styles/components/Dashboard.css";

// ============================================
// Constants
// ============================================
const SEARCH_MIN_LENGTH = 2;
const HIGHLIGHT_DURATION = 4000;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ============================
  // Refs
  // ============================
  const inputRef = useRef(null);
  const rowRefs = useRef({});
  const asideRef = useRef(null);

  // ============================
  // State
  // ============================
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState("");

  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [activePage, setActivePage] = useState("home");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletModal, setWalletModal] = useState(false);
  const [isMobileAsideOpen, setIsMobileAsideOpen] = useState(false);

  const [searchInputValue, setSearchInputValue] = useState("");
  const [selectedRowId, setSelectedRowId] = useState(null);

  // ============================
  // Derived values
  // ============================
  const username = user?.username || profileData?.username || "User";
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  // Filtered books based on search input
  const displayedBooks = searchInputValue.trim().length >= SEARCH_MIN_LENGTH
    ? libraryBooks.filter((book) => {
        const query = searchInputValue.trim().toLowerCase();
        const titleMatch = book.book_title?.toLowerCase().includes(query);
        const formatMatch = book.format_name?.toLowerCase().includes(query);
        const typeMatch = book.format_type?.toLowerCase().includes(query);
        return titleMatch || formatMatch || typeMatch;
      })
    : libraryBooks;

  // ============================
  // Effects
  // ============================

  // Load Library Data
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLibraryLoading(true);
        setLibraryError("");

        const response = await ContentService.getLicenses();
        const licenses = response.data?.results || response.data || [];

        // Digital and audio format licenses
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
        setLibraryError("Could not load your library data.");
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
        setProfileLoading(true);
        setProfileError("");

        const response = await UserService.getProfile();
        setProfileData(response.data);
      } catch (error) {
        console.error("Failed to load profile:", error);
        setProfileError("Could not load your profile.");
      } finally {
        setProfileLoading(false);
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

  const closeMobileAside = useCallback(() => {
    setIsMobileAsideOpen(false);
  }, []);

  // Close aside when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileAsideOpen &&
        asideRef.current &&
        !asideRef.current.contains(event.target)
      ) {
        if (!event.target.closest(".hamburger-menu")) {
          closeMobileAside();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileAsideOpen, closeMobileAside]);

  // ============================
  // Handlers
  // ============================
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const togglePage = useCallback((page) => {
    setActivePage((prev) => (prev === page ? "home" : page));
  }, []);

  const handleOpenProfile = useCallback(() => setIsModalOpen(true), []);
  const handleCloseProfile = useCallback(() => setIsModalOpen(false), []);
  const handleOpenWallet = useCallback(() => setWalletModal(true), []);
  const handleCloseWallet = useCallback(() => setWalletModal(false), []);

  const toggleMobileAside = useCallback(() => {
    setIsMobileAsideOpen((prev) => !prev);
  }, []);

  const handleSearch = useCallback((e) => {
    const value = e.target.value || "";
    setSearchInputValue(value);
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
                block: "center",
              });
            }
          }, 100);
        }
      }
    },
    [searchInputValue, libraryBooks]
  );

  // Connect Open buttons to Reader & AudioPlayer
  const openReader = useCallback(
    (book) => {
      navigate("/pdfreader", { state: { book } });
    },
    [navigate]
  );

  const openAudioPlayer = useCallback(
    (book) => {
      navigate("/audioplayer", { state: { book } });
    },
    [navigate]
  );

  // ============================
  // Aside Navigation Menu
  // ============================
  const AsideContent = () => (
    <aside>
      <div className="profile-pic">
        <img src={ppic14} alt="User Profile" loading="lazy" />
      </div>
      <ul>
        <li>
          <Link to="#" onClick={handleOpenProfile}>
            Profile
          </Link>
        </li>
        <li>
          <Link to="/subscription">Subscription</Link>
        </li>
        <li>
          <Link to="/favorites">Favorites</Link>
        </li>
        <li>
          <Link to="#" onClick={() => togglePage("addresses")}>
            Addresses
          </Link>
        </li>
        <li className="logout">
          <Link to="#" onClick={handleLogout} title="Logout">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
            </svg>
          </Link>
        </li>
      </ul>
    </aside>
  );

  return (
    <div>
      <div className="main-container">
        {/* Main Content Area */}
        <div className="main-text">
          <h2 className="greet">Hi, {username}</h2>

          {/* Search & Actions Bar */}
          <div className="search-container">
            <div className="left-icons-group">
              <li
                onClick={() => togglePage("basket")}
                style={{ cursor: "pointer" }}
                title={activePage === "home" ? "Open Cart" : "Back to Library"}
              >
                {activePage === "home" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="30px"
                    fill="white"
                  >
                    <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="white"
                  >
                    <path d="M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Zm80-400h160v-240H200v240Zm400 320h160v-240H600v240Zm0-480h160v-80H600v80ZM200-200h160v-80H200v80Zm160-320Zm240-160Zm0 240ZM360-280Z" />
                  </svg>
                )}
              </li>

              <li
                onClick={handleOpenWallet}
                style={{ cursor: "pointer" }}
                title="Wallet & Transactions"
              >
                <svg
                  width="30px"
                  height="30px"
                  viewBox="0 0 24 24"
                  fill="#939393"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M22 12v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5Z" />
                  <path d="M20 12h-4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h4" />
                  <path d="M18 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2" />
                </svg>
              </li>

              <li>
                <ThemeToggle page="dash" />
              </li>
            </div>

            {/* Center - Search Bar */}
            <div className="search-bar">
              <div className="search-icon">
                <div className="icon_se">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search your library..."
                  ref={inputRef}
                  value={searchInputValue}
                  onChange={handleSearch}
                  onKeyDown={handleKeyPress}
                />
              </div>
            </div>

            {/* Right - Date & Mobile Hamburger */}
            <span className="date">{formattedDate}</span>
            <div className="right-icons-group">
              <div className="hamburger-menu" onClick={toggleMobileAside}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="white"
                >
                  <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active View: Library / Home */}
          {activePage === "home" && (
            <>
              <p style={{ margin: "15px 0" }}>
                back to{" "}
                <Link to="/home" className="return-login-link">
                  Home
                </Link>
              </p>

              <div className="table-container">
                {libraryLoading && (
                  <p className="dashboard-status-text">Loading your library...</p>
                )}

                {!libraryLoading && libraryError && (
                  <p className="dashboard-status-text error-text">
                    {libraryError}
                  </p>
                )}

                {!libraryLoading &&
                  !libraryError &&
                  displayedBooks.length === 0 && (
                    <div className="empty-library-container">
                      <p>
                        {searchInputValue
                          ? "No books matched your search."
                          : "You don't own any digital or audio books yet."}
                      </p>
                      <Link to="/library" className="explore-library-link">
                        Explore Book Catalog →
                      </Link>
                    </div>
                  )}

                {!libraryLoading &&
                  !libraryError &&
                  displayedBooks.length > 0 && (
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Format</th>
                          <th>Status</th>
                          <th>Access</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedBooks.map((book) => {
                          const isAudio = book.format_type === "AUDIO";
                          const isValid = Boolean(
                            book.is_valid !== false && book.is_active !== false
                          );

                          return (
                            <tr
                              key={book.id}
                              ref={(el) => {
                                rowRefs.current[book.id] = el;
                              }}
                              className={
                                selectedRowId === book.id ? "highlight-row" : ""
                              }
                            >
                              <td>
                                <strong>{book.book_title}</strong>
                              </td>
                              <td>
                                <span
                                  className={`format-badge ${
                                    isAudio ? "badge-audio" : "badge-digital"
                                  }`}
                                >
                                  {book.format_name ||
                                    (isAudio ? "Audiobook" : "Digital (PDF)")}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`status-badge ${
                                    isValid ? "status-active" : "status-expired"
                                  }`}
                                >
                                  {isValid ? "Available" : "Expired"}
                                </span>
                              </td>
                              <td>
                                {isValid ? (
                                  isAudio ? (
                                    <button
                                      type="button"
                                      className="action-btn audio-btn"
                                      onClick={() => openAudioPlayer(book)}
                                      title="Listen to Audiobook"
                                    >
                                      🎧 LISTEN
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="action-btn read-btn"
                                      onClick={() => openReader(book)}
                                      title="Read E-Book / PDF"
                                    >
                                      📖 READ
                                    </button>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    className="action-btn disabled-btn"
                                    disabled
                                    title="License has expired"
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
                  )}
              </div>
            </>
          )}

          {/* Active View: Basket */}
          {activePage === "basket" && <Basket />}

          {/* Active View: Addresses */}
          {activePage === "addresses" && <Addresses />}
        </div>

        {/* Desktop Menu */}
        <div className="menu-bar">
          <AsideContent />
        </div>
      </div>

      {/* Mobile Slide-out Drawer */}
      <div
        className={`mobile-aside-overlay ${isMobileAsideOpen ? "open" : ""}`}
        onClick={closeMobileAside}
      >
        <div
          className={`mobile-aside-panel ${isMobileAsideOpen ? "open" : ""}`}
          ref={asideRef}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="close-aside-btn" onClick={closeMobileAside}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="white"
            >
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
            </svg>
          </div>
          <AsideContent />
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <Profile
          open={isModalOpen}
          onClose={handleCloseProfile}
          profileData={profileData}
          profileLoading={profileLoading}
          profileError={profileError}
          onProfileUpdated={setProfileData}
        />
      )}
      {walletModal && (
        <Financial open={walletModal} onClose={handleCloseWallet} />
      )}
    </div>
  );
}