import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ---Components---
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer';
import ReusableSlider from '../../Components/common/ReusableSlider';
import Notification from '../../Components/feature/Notification';
import { useAuth } from '../../Context/AuthContext';
import  {ThemeToggle}  from '../../Components/common/ThemeToggle';

// --- Styles ---
import "../../Styles/components/Home.css";

// --- Animations ---
import {
  cardVariants,
  containerVariants,
  numberVariants,
  ux_TitleVariants,
} from "../../../animations";

// --- Services ---
import BookService from "../../Services/BookService";

// --- Constants ---
import { ppic1 } from "../../Constants";


// ============================================
// Presentation Data
// ============================================


// These remain presentation data until the backend
// exposes real platform statistics.
const INTRODUCE = [
  {
    id: 1,
    value: "+500",
    label: "online-user",
    color: "purple",
  },
  {
    id: 2,
    value: "+50",
    label: "author",
    color: "#00a859",
  },
  {
    id: 3,
    value: "+1000",
    label: "satisfy-customer",
    color: "#003ee9",
  },
  {
    id: 4,
    value: "+4",
    label: "years experience",
    color: "red",
  },
];


const USER_EXPERIENCE = [
  {
    username: "mohsen",
    experience: "thanks pn for access millions book",
  },
  {
    username: "hosein",
    experience: "fantastic quality in pdf-reading",
  },
  {
    username: "ehsan",
    experience: "the subscription pay is satisfying",
  },
];


// ============================================
// Helpers
// ============================================

function extractBooks(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}


function getBookImage(book) {
  return (
    book.cover_image_url ||
    book.cover_image ||
    "https://placehold.co/400x600?text=No+Image"
  );
}


function getBookPrice(book) {
  if (
    book.price === null ||
    book.price === undefined ||
    book.price === ""
  ) {
    return "N/A";
  }

  const numericPrice = Number(book.price);

  if (Number.isNaN(numericPrice)) {
    return `${book.price} IRR`;
  }

  return `${numericPrice.toLocaleString()} IRR`;
}


function mapBookForSlider(book) {
  return {
    id: book.id,
    title: book.title || "Untitled Book",
    price: getBookPrice(book),
    link: String(book.id),
    authorId: book.author_id || book.author?.id || 0,
    author_profile:
      book.author?.profile_image_url ||
      book.author_profile ||
      ppic1,
    img: getBookImage(book),
  };
}


// ============================================
// Main Component
// ============================================

export default function Home() {

  const navigate = useNavigate();
  const inputRef = useRef(null);

  // ----------------------------------------
  // Book State
  // ----------------------------------------

  const [heroBooks, setHeroBooks] = useState([]);
  const [newBooks, setNewBooks] = useState([]);
  const [latestBooks, setLatestBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const {isLoggedIn}=useAuth();
  const notificationRef = useRef();


  const [loadingBooks, setLoadingBooks] = useState(true);
  const [bookError, setBookError] = useState("");


  // ----------------------------------------
  // Search State
  // ----------------------------------------

  const [searchInputValue, setSearchInputValue] = useState("");


  // ----------------------------------------
  // Hero Carousel State
  // ----------------------------------------

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);


  // ----------------------------------------
  // Static Presentation Data
  // ----------------------------------------
// ---States---
  // eslint-disable-next-line no-unused-vars
  const [currentSlide,setCurrentSlide] = useState(0)
  const [isHovered,setIsHovered]=useState(false)
  

  const introduce = INTRODUCE;
  const user_experience = USER_EXPERIENCE;


  // ============================================
  // Load Home Books
  // ============================================

  useEffect(() => {

    let cancelled = false;

    const loadBooks = async () => {

      try {

        setLoadingBooks(true);
        setBookError("");



        const [newBooksResponse, allBooksResponse, genresResponse,] =
          await Promise.all([
            BookService.getNewBooks(),
            BookService.getBooks(),
            BookService.getGenres(),
          ]);

        if (cancelled) {
          return;
        }

        const newBooksData =
          extractBooks(newBooksResponse);

        const allBooksData =
          extractBooks(allBooksResponse);

        setGenres(genresResponse);


        // --------------------------------
        // New Arrivals
        // --------------------------------

        const mappedNewBooks =
          newBooksData
            .map(mapBookForSlider)
            .slice(0, 10);

        setNewBooks(mappedNewBooks);


        // --------------------------------
        // Latest Books
        //
        // The backend currently does not
        // expose popularity statistics, so
        // don't pretend newest books are
        // "popular".
        // --------------------------------

        const sortedBooks =
          [...allBooksData]
            .sort(
              (a, b) =>
                Number(b.id) - Number(a.id)
            );

        const latest =
          sortedBooks
            .map(mapBookForSlider)
            .slice(0, 10);

        setLatestBooks(latest);


        // --------------------------------
        // Hero
        //
        // Use the newest books for the
        // hero carousel.
        // --------------------------------

        setHeroBooks(
          mappedNewBooks.slice(0, 5)
        );

      } catch (err) {

        console.error(
          "Failed to load home books:",
          err
        );

        if (!cancelled) {

          setBookError(
            err.response?.data?.detail ||
            "Failed to load books."
          );

        }

      } finally {

        if (!cancelled) {
          setLoadingBooks(false);
        }

      }

    };


    loadBooks();


    return () => {
      cancelled = true;
    };

  }, []);


  // ============================================
  // Search
  // ============================================

  const handleSearch = (event) => {

    setSearchInputValue(
      event.target.value
    );

  };


  const handleSearchNavigate = (term) => {

    const trimmed =
      term.trim();

    if (trimmed.length < 2) {
      return;
    }

    navigate(
      `/search/${encodeURIComponent(trimmed)}`
    );

  };


  const handleKeyPress = (event) => {

    if (
      event.key === "Enter" &&
      searchInputValue.trim().length >= 2
    ) {

      handleSearchNavigate(
        searchInputValue
      );

    }

  };


  // ============================================
  // Hero Slide Navigation
  // ============================================

  const totalSlides = heroBooks.length;


  const nextSlide = useCallback(() => {

    if (totalSlides === 0) {
      return;
    }

    setCurrentSlide(
      previous =>
        (previous + 1) % totalSlides
    );

  }, [totalSlides]);


  const previousSlide = useCallback(() => {

    if (totalSlides === 0) {
      return;
    }

    setCurrentSlide(
      previous =>
        (previous - 1 + totalSlides) %
        totalSlides
    );

  }, [totalSlides]);


  // ============================================
  // Auto Slide
  // ============================================

  useEffect(() => {

    if (
      isHovered ||
      totalSlides <= 1
    ) {
      return;
    }

    const interval =
      setInterval(
        nextSlide,
        3000
      );

    return () =>
      clearInterval(interval);

  }, [
    nextSlide,
    isHovered,
    totalSlides,
  ]);


  // ============================================
  // Keep Slide Index Valid
  // ============================================

  useEffect(() => {

    if (
      totalSlides > 0 &&
      currentSlide >= totalSlides
    ) {

      setCurrentSlide(0);

    }

  }, [
    currentSlide,
    totalSlides,
  ]);


  // ============================================
  // Category Navigation
  // ============================================

  const handleCategoryClick = (
    categoryTitle
  ) => {

    const categoryItem =
      genres.find(
        item =>
          item.title === categoryTitle
      );

    const searchValue =
      categoryItem?.titlemap?.[0] ||
      categoryTitle;

    navigate(
      `/search/${encodeURIComponent(searchValue)}`
    );

  };

  const GENRE_ICONS = {
    HISTORY: "/icons/cat-history.svg",
    SCI_FI: "/icons/cat-science.svg",
    ART_DESIGN: "/icons/cat-art.svg",
    PSYCHOLOGY: "/icons/cat-psychology.svg",
    TECH: "/icons/cat-tech.svg",
    TRIP_GEO: "/icons/cat-trip.svg",
    FINANCIAL: "/icons/cat-finance.svg",
    RELIGIOUS: "/icons/cat-religious.svg",
    NOVEL: "/icons/cat-novel.svg",
  };

  const getGenreIcon = (genre) =>
    GENRE_ICONS[genre] || "/icons/cat-default.svg";
// ---Handle isLoggedin---
  const handleLoginCheck = useCallback((e)=>{
    if(!isLoggedIn){
      e.preventDefault();
      if(notificationRef.current){
        notificationRef.current.showNotif(' require','error',{
          linkText:"login",
          linkHref:"/login"
        })
      }
      return false;
    }
    return true;
     
  },[isLoggedIn])


// ---Derived State---
    const slide = totals > 0 ? books[currentSlide] : null;


  // ============================================
  // Derived Hero Book
  // ============================================

  const slide =
    totalSlides > 0
      ? heroBooks[currentSlide]
      : null;


  // ============================================
  // Loading State
  // ============================================

  if (loadingBooks) {

    return (
      <div className="p-5 text-center">
        Loading home page...
      </div>
    );

  }


  // ============================================
  // Render
  // ============================================

  return (

    <>

      <div>

        <main className="Container_home">

          {/* Navigation */}

          <Navbar />


          {/* Mobile Top Navigation */}

          <div className="TopRes">

            <nav className="top-res">

              <div className="up">

                <Link
                  to="/home"
                  className="logo-res"
                >
                  PageNet
                </Link>

              </div>


              <div className="down">

                <ThemeToggle page="home" />


                <input
                  ref={inputRef}
                  type="search"
                  placeholder="type..."
                  className="search-res"
                  value={searchInputValue}
                  onChange={handleSearch}
                  onKeyDown={handleKeyPress}
                />


                <button
                  onClick={() =>
                    navigate(
                      "/subscription"
                    )
                  }
                  className="sub-list"
                  type="button"
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="24px"
                  >

                    <path
                      d="M160-240q-50 0-85-35t-35-85v-240q0-50 35-85t85-35h540q50 0 85 35t35 85v240q0 50-35 85t-85 35H160Zm0-80h540q17 0 28.5-11.5T740-360v-240q0-17-11.5-28.5T700-640H160q-17 0-28.5 11.5T120-600v240q0 17 11.5 28.5T160-320Zm700-60v-200h20q17 0 28.5 11.5T920-540v120q0 17-11.5 28.5T880-380h-20Zm-700 20v-240h540v240H160Z"
                    />

                  </svg>

                </button>

              </div>

            </nav>

          </div>


          {/* Categories */}

          <section className="categories-section">

            <div
              className="categories-grid"
              id="home-categories"
            >

              {genres.map((genre) => (
                <div
                  key={genre.value}
                  className="category-card"
                  onClick={() => handleCategoryClick(genre.value)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="category-icon">
                    <img
                      src={getGenreIcon(genre.value)}
                      alt={`${genre.label} icon`}
                    />
                  </div>

                  <div className="category-title">
                    {genre.label}
                  </div>
                </div>
              ))}

            </div>

          </section>


          {/* Main Hero Carousel */}

          <div
            className="carousel-container"
            onMouseEnter={() =>
              setIsHovered(true)
            }
            onMouseLeave={() =>
              setIsHovered(false)
            }
          >

            {bookError && (

              <p className="subscription-state">
                {bookError}
              </p>

            )}


            {slide ? (

              <div
                className="carousel-card"
                onClick={() =>
                  navigate(
                    `/book/${slide.id}`
                  )
                }
                role="button"
              >

                <img
                  className="slide-image"
                  src={slide.img}
                  alt={slide.title}
                />


                <h3 className="slide-title">

                  {slide.title}

                </h3>

              </div>

            ) : (

              <p>
                No books available.
              </p>

            )}


              <div className="indicators">

                {heroBooks.map(
                  (_, index) => (

                    <span
                      key={index}
                      className={
                        index ===
                          currentSlide
                          ? "dot active"
                          : "dot"
                      }
                      onClick={() =>
                        setCurrentSlide(
                          index
                        )
                      }
                    />

                  )
                )}

              </div>

          </div>


          {/* Introduction Stats */}

          <motion.div
            className="introduce-container"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
            variants={containerVariants}
          >

            {introduce.map(int => (

              <motion.div
                key={int.id}
                className="int-card"
                variants={cardVariants}
                whileHover={{
                  scale: 1.05,
                }}
              >

                <motion.h2
                  className="int-value"
                  style={{
                    color: int.color,
                  }}
                  variants={numberVariants}
                >

                  {int.value}

                </motion.h2>


                <motion.p className="int-label">

                  {int.label}

                </motion.p>

              </motion.div>

            ))}

          </motion.div>


          {/* New Arrivals */}

          <ReusableSlider
            items={newBooks}
            title="New Arrivals"
            viewAllLink="/search/new"
            customClass="home-popular"
            cardWidth="300px"
          />


          {/* Latest Books */}

          <ReusableSlider
            items={latestBooks}
            title="Latest Books"
            viewAllLink="/library"
            customClass="home-popular"
            cardWidth="300px"
          />


          {/* User Experience */}

          <motion.div
            className="ux-container-main"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
            variants={containerVariants}
          >

            <motion.div
              className="ux-container1"
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.3,
              }}
            >

              <motion.h2
                className="ux-value"
                variants={ux_TitleVariants}
              >
                User-Experience
              </motion.h2>

            </motion.div>


            <motion.div
              className="ux-container2"
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.3,
              }}
            >

              {user_experience.map(ux => (

                <motion.div
                  key={ux.username}
                  className="ux-card"
                  variants={cardVariants}
                  whileHover={{
                    scale: 1.05,
                  }}
                >

                  <h3>
                    {ux.username}
                  </h3>

                  <p>
                    {ux.experience}
                  </p>

                </motion.div>

              ))}

            </motion.div>

          </motion.div>


          {/* Footer */}

          <Footer />

        </main>


        {/* Bottom Navigation */}

        <div className="BottomNav">

          <nav className="bottom-navbar">

            <Link
              to="/"
              className="nav-item"
            >

              <i className="fas fa-home"></i>

              <span>
                Home
              </span>

            </Link>


            <Link
              to="/favorites"
              onClick={handleLoginCheck}
              className="nav-item"
            >

              <i className="fa-solid fa-heart"></i>

              <span>
                favorite
              </span>

            </Link>


            <Link
              to="/basket"
              className="nav-item"
            >

              <svg
                className="cart-icon"
                viewBox="0 -960 960 960"
              >

                <path
                  d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"
                />

              </svg>

              <span>
                Cart
              </span>

            </Link>


            <Link
              to="/library"
              className="nav-item"
            >

              <i className="fas fa-book"></i>

              <span>
                Library
              </span>

            </Link>

                <Link to="/dashboard"  
                      onClick={handleLoginCheck}
                      className="nav-item"
                >
                      <i className="fas fa-user"></i>
                      <span>Dashboard</span>
                </Link>
          </nav>

        </div>

        <Notification ref={notificationRef} />
    </div>
    </>

  );

}