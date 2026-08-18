import { useCallback, useEffect, useRef, useState } from "react";

import BookService from "../../Services/BookService";

import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";

import { Link } from "react-router-dom";

import "../../Styles/components/Library.css";


// ============================================
//      Main
// ============================================

export default function Library() {


    // ============================================
    //      State
    // ============================================

    const [books, setBooks] = useState([]);

    const [page, setPage] = useState(1);

    const [hasMore, setHasMore] = useState(true);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");



    // ============================================
    //      Refs
    // ============================================

    const observerRef = useRef(null);

    const loadingRef = useRef(false);





    // ============================================
    //      Fetch Books
    // ============================================

    const loadBooks = useCallback(async () => {


        if (loadingRef.current || !hasMore) {
            return;
        }


        loadingRef.current = true;

        setLoading(true);



        try {


            const response = await BookService.getBooks({
                page
            });



            const newBooks = response.results || [];



            setBooks(previousBooks => {


                const mergedBooks = [
                    ...previousBooks,
                    ...newBooks
                ];



                // Prevent duplicate IDs
                return mergedBooks.filter(
                    (book, index, self) =>
                        index === self.findIndex(
                            item => item.id === book.id
                        )
                );


            });



            setHasMore(Boolean(response.next));


            setPage(previousPage => previousPage + 1);



        }
        catch (err) {


            console.error(
                "Library loading failed:",
                err
            );


            setError(
                "Could not load books."
            );


        }
        finally {


            loadingRef.current = false;

            setLoading(false);


        }


    }, [page, hasMore]);







    // ============================================
    //      Initial Load
    // ============================================

    useEffect(() => {

        loadBooks();

    }, []);







    // ============================================
    //      Infinite Scroll
    // ============================================

    useEffect(() => {


        const observer = new IntersectionObserver(
            entries => {


                if (
                    entries[0].isIntersecting &&
                    hasMore &&
                    !loadingRef.current
                ) {

                    loadBooks();

                }


            },
            {
                threshold: 1
            }
        );



        const target = observerRef.current;



        if (target) {

            observer.observe(target);

        }



        return () => {

            if (target) {

                observer.unobserve(target);

            }

        };


    }, [loadBooks, hasMore]);








    // ============================================
    //      Render
    // ============================================

    return (

        <div className="all">


            {/* Navigation */}

            <div className="full-lib-nav">

                <Navbar />

            </div>



            <div className="lib-nav">

                <SimpleNav />

            </div>





            <div className="lib-container">



                <div className="head">

                    <p className="head-txt">
                        Explore in Ocean
                    </p>

                </div>





                <div className="explore">


                    {books.map(book => (

                        <Link
                            key={book.id}
                            to={`/book/${book.id}`}
                            className="card-ha"
                        >

                            <img
                                src={
                                    book.cover_image_url ||
                                    "/default-book.png"
                                }
                                alt={book.title}
                            />

                        </Link>

                    ))}


                </div>





                {/* Infinite scroll trigger */}

                <div
                    ref={observerRef}
                    style={{
                        height: "40px"
                    }}
                />




                {loading && (

                    <p>
                        Loading more books...
                    </p>

                )}



                {error && (

                    <p>
                        {error}
                    </p>

                )}



                {!hasMore && books.length > 0 && (

                    <p>
                        You reached the end.
                    </p>

                )}




            </div>


        </div>

    );

}