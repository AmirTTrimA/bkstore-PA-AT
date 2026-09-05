import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import BookService from "../../Services/BookService";

import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Library.css";


// ============================================
//      Main
// ============================================

export default function Library() {

    // ============================================
    //      State
    // ============================================

    const [books, setBooks] = useState([]);

    const [loading, setLoading] = useState(true);

    const [loadingMore, setLoadingMore] = useState(false);

    const [hasMore, setHasMore] = useState(true);

    const [error, setError] = useState("");


    // ============================================
    //      Refs
    // ============================================

    const loadingRef = useRef(false);

    const currentPageRef = useRef(1);

    const hasMoreRef = useRef(true);

    const requestedPagesRef = useRef(new Set());


    // ============================================
    //      Load Books
    // ============================================

    const loadBooks = useCallback(async (pageNumber) => {
        if (
            loadingRef.current ||
            !hasMoreRef.current ||
            requestedPagesRef.current.has(pageNumber)
        ) {
            return false;
        }

        requestedPagesRef.current.add(pageNumber);
        loadingRef.current = true;

        setError("");

        if (pageNumber === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const response = await BookService.getBooks({
                page: pageNumber,
            });

            const results = response.results || [];
            const nextExists = Boolean(response.next);

            setBooks(previousBooks => {
                if (pageNumber === 1) {
                    return results;
                }

                const existingIds = new Set(
                    previousBooks.map(book => book.id)
                );

                const newBooks = results.filter(
                    book => !existingIds.has(book.id)
                );

                return [
                    ...previousBooks,
                    ...newBooks,
                ];
            });

            currentPageRef.current = pageNumber;

            hasMoreRef.current = nextExists;
            setHasMore(nextExists);

            return nextExists;

        } catch (err) {
            console.error(
                `Failed loading library page ${pageNumber}:`,
                err
            );

            requestedPagesRef.current.delete(pageNumber);

            setError("Could not load books.");

            return false;

        } finally {
            loadingRef.current = false;

            setLoading(false);
            setLoadingMore(false);
        }
    }, []);


    // ============================================
    //      Initial Load
    // ============================================

    useEffect(() => {

        loadBooks(1);

    }, [loadBooks]);


    // ============================================
    //      Infinite Scroll
    // ============================================

    useEffect(() => {
        const handleScroll = () => {
            if (
                loadingRef.current ||
                !hasMoreRef.current
            ) {
                return;
            }

            const scrollPosition =
                window.innerHeight + window.scrollY;

            const documentHeight =
                document.documentElement.scrollHeight;

            const distanceFromBottom =
                documentHeight - scrollPosition;

            if (distanceFromBottom <= 500) {
                const nextPage =
                    currentPageRef.current + 1;

                loadBooks(nextPage);
            }
        };

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true }
        );

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            );
        };
    }, [loadBooks]);

    useEffect(() => {
        if (
            loading ||
            loadingMore ||
            !hasMore
        ) {
            return;
        }

        const documentHeight =
            document.documentElement.scrollHeight;

        const viewportHeight =
            window.innerHeight;

        if (documentHeight <= viewportHeight + 500) {
            const nextPage =
                currentPageRef.current + 1;

            loadBooks(nextPage);
        }
    }, [
        books.length,
        loading,
        loadingMore,
        hasMore,
        loadBooks,
    ]);

    // ============================================
    //      Loading State
    // ============================================

    if (loading) {

        return (

            <div className="all">

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


                    <div className="library-loading">

                        <div className="library-spinner" />

                        <p>
                            Loading books...
                        </p>

                    </div>

                </div>

            </div>

        );

    }


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


            {/* Main Container */}

            <div className="lib-container">


                {/* Header */}

                <div className="head">

                    <p className="head-txt">
                        Explore in Ocean
                    </p>

                </div>


                {/* Error */}

                {error && (

                    <div className="library-message library-error">

                        <p>
                            {error}
                        </p>

                    </div>

                )}


                {/* Empty */}

                {!error && books.length === 0 && (

                    <div className="library-message">

                        <h2>
                            No books found
                        </h2>

                        <p>
                            There are no books available yet.
                        </p>

                    </div>

                )}


                {/* Books */}

                {books.length > 0 && (

                    <div className="explore">

                        {books.map(book => (

                            <Link
                                key={book.id}
                                to={`/book/${book.id}`}
                                className="card-ha"
                            >

                                {/* Cover */}

                                <div className="library-card-cover">

                                    <img
                                        src={
                                            book.cover_image_url ||
                                            "/default-book.png"
                                        }
                                        alt={book.title}
                                        loading="lazy"
                                    />

                                </div>


                                {/* Information */}

                                <div className="library-card-info">

                                    <h3
                                        className="library-card-title"
                                        title={book.title}
                                    >
                                        {book.title}
                                    </h3>


                                    <p className="library-card-author">

                                        {book.author_name ||
                                            book.author?.name ||
                                            "Unknown Author"}

                                    </p>


                                    {book.genre && (

                                        <span className="library-card-genre">

                                            {book.genre
                                                .replaceAll("_", " ")
                                                .toLowerCase()
                                                .replace(
                                                    /\b\w/g,
                                                    char =>
                                                        char.toUpperCase()
                                                )}

                                        </span>

                                    )}


                                    {book.price != null && (

                                        <p className="library-card-price">

                                            {formatPrice(book.price)}

                                        </p>

                                    )}


                                </div>

                            </Link>

                        ))}

                    </div>

                )}


                {/* Infinite Scroll Trigger */}


                {/* Loading More */}

                {loadingMore && (

                    <div className="library-loading-more">

                        <div className="library-spinner small" />

                        <p>
                            Loading more books...
                        </p>

                    </div>

                )}


                {/* End */}

                {!hasMore && books.length > 0 && (

                    <div className="library-end">

                        <span />

                        <p>
                            You reached the end.
                        </p>

                        <span />

                    </div>

                )}

            </div>

        </div>

    );

}