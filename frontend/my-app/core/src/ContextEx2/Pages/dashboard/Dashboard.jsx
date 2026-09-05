import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";

import Financial from "./financial/Financial";
import Profile from "./profile/Profile";

import { ThemeToggle } from "../../Components/common/ThemeToggle";

import {
  ppic14
} from "../../Constants";

import ContentService from "../../Services/ContentService";
import UserService from "../../Services/UserService";

import "../../Styles/components/Dashboard.css";


export default function Dashboard() {


  const { user, logout } = useAuth();

  const navigate = useNavigate();



  // ============================
  // State
  // ============================


  const [libraryBooks, setLibraryBooks] = useState([]);

  const [libraryLoading, setLibraryLoading] = useState(true);

  const [libraryError, setLibraryError] = useState("");



  const [activePage, setActivePage] = useState("home");


  const [isModalOpen, setIsModalOpen] = useState(false);

  const [walletModal, setWalletModal] = useState(false);





  // ============================
  // Derived values
  // ============================


  const username =
    user?.username || "User";


  const formattedDate =
    new Date().toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "numeric",
        day: "numeric"
      }
    );





  // ============================
  // Effects
  // ============================


  useEffect(() => {


    const loadDashboardData = async () => {


      try {


        const response =
          await ContentService.getLicenses();



        setLibraryBooks(
          response.data.results ||
          response.data ||
          []
        );


      }
      catch (error) {


        console.error(
          "Failed loading library:",
          error
        );


        setLibraryError(
          "Could not load library data."
        );


      }
      finally {

        setLibraryLoading(false);

      }


    };


    loadDashboardData();


  }, []);






  useEffect(() => {


    const loadProfile = async () => {


      try {


        await UserService.getProfile();


      }
      catch (error) {


        console.error(
          "Failed loading profile:",
          error
        );


      }


    };


    loadProfile();


  }, []);







  // ============================
  // Handlers
  // ============================


  const handleLogout = useCallback(() => {


    logout();

    navigate("/login");


  }, [
    logout,
    navigate
  ]);






  const handleNavigation = useCallback(
    (page) => {


      setActivePage(page);


    },
    []
  );






  const openBook = useCallback(
    (bookId) => {


      navigate(
        `/book/${bookId}`
      );


    },
    [navigate]
  );






  return (

    <div className="dashboard-container">



      {/* Header */}

      <header className="dashboard-header">


        <div className="dashboard-user-section">


          <img
            src={ppic14}
            alt="profile"
            className="dashboard-profile-image"
            loading="lazy"
          />


          <div>


            <h2>
              Welcome, {username}
            </h2>


            <p>
              {formattedDate}
            </p>


          </div>


        </div>





        <div className="dashboard-actions">


          <ThemeToggle />



          <button

            onClick={handleLogout}

            className="dashboard-logout-btn"

          >

            Logout

          </button>



        </div>


      </header>






      {/* Navigation */}

      <nav className="dashboard-nav">


        <button
          onClick={() =>
            handleNavigation("home")
          }
        >
          Home
        </button>



        <button
          onClick={() =>
            handleNavigation("library")
          }
        >
          Library
        </button>



        <button
          onClick={() =>
            setWalletModal(true)
          }
        >
          Wallet
        </button>



        <button
          onClick={() =>
            setIsModalOpen(true)
          }
        >
          Profile
        </button>



      </nav>







      {/* Content */}


      <main className="dashboard-content">



        {
          activePage === "home" && (

            <section className="dashboard-section">


              <h2>
                Your Library
              </h2>




              {
                libraryLoading && (

                  <p>
                    Loading books...
                  </p>

                )
              }




              {
                libraryError && (

                  <p className="error-text">

                    {libraryError}

                  </p>

                )
              }






              {
                !libraryLoading &&
                libraryBooks.length === 0 && (

                  <p>
                    Your library is empty.
                  </p>

                )
              }







              <div className="dashboard-books-table">


                {
                  libraryBooks.map(
                    book => (

                      <div

                        key={book.id}

                        className="dashboard-book-row"

                      >



                        <div className="book-info">


                          <h3>
                            {book.book_title}
                          </h3>


                          <p>
                            Format:
                            {" "}
                            {book.format_name}
                          </p>


                          <p>
                            Type:
                            {" "}
                            {book.format_type}
                          </p>



                        </div>




                        <button

                          className="open-book-btn"

                          onClick={() =>
                            openBook(
                              book.book_id
                            )
                          }

                        >

                          Open

                        </button>



                      </div>


                    )
                  )
                }


              </div>



            </section>

          )
        }








        {
          activePage === "library" && (


            <section>


              <h2>
                Library
              </h2>


              <Link
                to="/library"
              >

                Explore all books

              </Link>


            </section>


          )
        }





      </main>







      {
        isModalOpen && (

          <Profile

            open={isModalOpen}

            onClose={() =>
              setIsModalOpen(false)
            }

          />

        )
      }







      {
        walletModal && (

          <Financial

            open={walletModal}

            onClose={() =>
              setWalletModal(false)
            }

          />

        )
      }




    </div>

  );


}