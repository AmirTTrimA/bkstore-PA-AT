import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DeleteIcon from "@mui/icons-material/Delete";

import SimpleNav from "../../Components/SimpleNav";

import WishlistService from "../../Services/WishlistService";

import "../../Styles/components/Favorites.css";


// ============================================
//      Main Component
// ============================================

export default function Favorites() {


    const navigate = useNavigate();


    // ============================================
    //      State
    // ============================================

    const [favItems, setFavItems] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [clearing, setClearing] = useState(false);



    // ============================================
    //      Load Wishlist
    // ============================================

    const loadFavorites = useCallback(async () => {

        try {

            setError("");

            const response =
                await WishlistService.getWishlist();


            setFavItems(
                response.data.results ||
                response.data
            );


        } catch (err) {

            console.error(
                "Failed loading wishlist:",
                err
            );

            setError(
                "Could not load favorites."
            );

        } finally {

            setLoading(false);

        }

    }, []);



    // ============================================
    //      Remove All
    // ============================================

    const clearFavorites = async () => {

        if (clearing || favItems.length === 0) {
            return;
        }


        setClearing(true);


        try {

            await Promise.all(
                favItems.map(item =>
                    WishlistService.removeBook(
                        item.id
                    )
                )
            );


            setFavItems([]);


        } catch (err) {

            console.error(
                "Failed clearing wishlist:",
                err
            );

            setError(
                "Could not clear favorites."
            );

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

    const isEmpty =
        favItems.length === 0;



    // ============================================
    //      Render
    // ============================================

    return (

        <>


            <div className="fav-nav">

                <SimpleNav />

            </div>



            <div className="fav-container">


                {/* Header */}

                <div className="fav-nav-head">


                    <button
                        onClick={() => navigate(-1)}
                        className="big-back-btn"
                        id="back2"
                    >

                        <i className="fas fa-angle-left"></i>

                    </button>


                    <p className="titler">
                        mylist
                    </p>


                </div>



                {/* Clear Button */}

                {!isEmpty && (

                    <button
                        onClick={clearFavorites}
                        className="remove-fav-btn"
                        disabled={clearing}
                        title="Clear favorites"
                    >

                        <DeleteIcon
                            sx={{
                                width: 29,
                                height: 29
                            }}
                        />

                    </button>

                )}



                {/* Loading */}

                {loading && (

                    <div className="empty-favorites">

                        <p>
                            Loading favorites...
                        </p>

                    </div>

                )}



                {/* Error */}

                {!loading && error && (

                    <div className="empty-favorites">

                        <p>
                            {error}
                        </p>


                        <button
                            onClick={loadFavorites}
                            className="browse-btn"
                        >
                            Try Again
                        </button>

                    </div>

                )}



                {/* Empty State */}

                {!loading && !error && isEmpty && (

                    <div className="empty-favorites">

                        <p>
                            Empty favorites
                        </p>


                        <button
                            onClick={() =>
                                navigate("/library")
                            }
                            className="browse-btn"
                        >
                            Back to Library
                        </button>

                    </div>

                )}



                {/* Favorites */}

                {!loading && !error && !isEmpty && (

                    <div className="cards-row">


                        {favItems.map(item => (

                            <div
                                key={item.id}
                                className="fav-cards"
                            >


                                <div
                                    className="card-pic"
                                    onClick={() =>
                                        navigate(
                                            `/book/${item.book_id}`
                                        )
                                    }
                                >

                                    <img
                                        src={
                                            item.cover_image_url ||
                                            "/default-book.png"
                                        }
                                        alt={item.title}
                                    />

                                </div>



                                <span className="card-title">

                                    {item.title}

                                </span>


                            </div>

                        ))}


                    </div>

                )}


            </div>


        </>

    );

}