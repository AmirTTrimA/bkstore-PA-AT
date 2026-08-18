import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BookService from "../../Services/BookService";
import BasketService from "../../Services/BasketService";

import Footer from "../../Components/Footer";
import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import Notification from "../../Components/feature/Notification";

import { useAuth } from "../../Context/AuthContext";

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

  const [addingCart, setAddingCart] = useState(false);



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
  // Favorite state
  // ==========================

  useEffect(() => {

    if (!book) return;


    const favorites =
      JSON.parse(
        localStorage.getItem("favorite")
      ) || [];


    setLiked(
      favorites.some(
        item => item.id === book.id
      )
    );


  }, [book]);



  // ==========================
  // Favorite handler
  // ==========================

  const toggleFavorite = () => {


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


    let favorites =
      JSON.parse(
        localStorage.getItem("favorite")
      ) || [];



    if (liked) {

      favorites =
        favorites.filter(
          item => item.id !== book.id
        );


      setLiked(false);


    } else {


      favorites.push({

        id: book.id,

        title: book.title,

        cover_image_url:
          book.cover_image_url,

        author:
          book.author_name

      });


      setLiked(true);

    }


    localStorage.setItem(
      "favorite",
      JSON.stringify(favorites)
    );

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
      <div className="container py-5">
        Loading book...
      </div>
    );

  }


  if (!book || error) {

    return (
      <div className="container py-5">
        {error || "Book not found"}
      </div>
    );

  }



  // ==========================
  // Render
  // ==========================

  return (

    <>

      <div className="book-nav-full">
        <Navbar />
      </div>


      <div className="book-nav-res">
        <SimpleNav />
      </div>



      <Notification
        ref={notificationRef}
      />



      <main className="book-container">


        <section className="main">


          <div className="main-book">


            <div className="book-card">


              <img

                className="bk-slide-image"

                src={
                  book.cover_image_url ||
                  "/default-book.png"
                }

                alt={book.title}

              />



              <div className="info">


                <h1 className="bk-slide-title">

                  {book.title}

                </h1>



                <div className="author-wrapper">

                  <button
                    id="ext"
                    onClick={goAuthor}
                  >
                    {book.author_name}
                  </button>

                </div>



                <div className="book-categories">

                  <span className="book-categories-link">

                    {book.genre}

                  </span>

                </div>



                <p className="extra-info">

                  ISBN:
                  {" "}
                  {book.isbn}

                </p>



                <button
                  className="mobile-like"
                  onClick={toggleFavorite}
                >

                  {liked
                    ? "Remove favorite"
                    : "Add favorite"}

                </button>


              </div>


            </div>


          </div>




          <aside className="side-card">


            <label>
              Select format
            </label>



            <div className="chooser">

              <select

                value={
                  selectedFormat?.id || ""
                }

                onChange={(e) => {

                  const format =
                    book.formats.find(
                      item =>
                        item.id ===
                        Number(e.target.value)
                    );


                  setSelectedFormat(format);

                }}

              >

                {book.formats?.map(format => (

                  <option
                    key={format.id}
                    value={format.id}
                  >

                    {format.type}
                    {" - "}
                    {format.price}

                  </option>

                ))}


              </select>

            </div>




            <div className="show-price">

              {selectedFormat?.price}

            </div>




            <button

              className="book-buy-btn"

              onClick={addToCart}

              disabled={addingCart}

            >

              {
                addingCart
                  ? "Adding..."
                  : "Add to cart"
              }


            </button>


          </aside>



        </section>




        <section className="book-rest">


          <div className="about-book">

            <div className="about-book-content">

              <h2>
                About this book
              </h2>


              <p>
                {book.description}
              </p>

            </div>


          </div>


        </section>


      </main>



      <Footer />

    </>

  );

}