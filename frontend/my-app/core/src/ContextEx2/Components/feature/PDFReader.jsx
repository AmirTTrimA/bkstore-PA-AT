import React, { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page } from "react-pdf";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { ThemeToggle } from "../common/ThemeToggle";
import BookService from "../../Services/BookService";

import "../../../pdf-worker";
import "../../Styles/components/PDFReader.css";

// Keyboard navigation keys
const KEYBOARD_NAVIGATION_KEYS = {
  NEXT: ["ArrowRight", "ArrowUp"],
  PREV: ["ArrowLeft", "ArrowDown"],
  HOME: ["Home"],
  END: ["End"],
};

export default function PDFReader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookId } = useParams();

  const containerRef = useRef(null);

  // Book metadata states
  const [book, setBook] = useState(location.state?.book || null);
  const [isLoadingBook, setIsLoadingBook] = useState(!location.state?.book && !!bookId);
  const [bookError, setBookError] = useState(null);

  // Document states
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [jumpInput, setJumpInput] = useState("1");
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resumeToast, setResumeToast] = useState("");

  const effectiveBookId = bookId || book?.book_id || book?.id;
  const storageKey = effectiveBookId ? `pdf_progress_${effectiveBookId}` : null;

  // Fetch book if accessed directly via /pdf/:bookId without state
  useEffect(() => {
    if (!book && bookId) {
      setIsLoadingBook(true);
      setBookError(null);
      BookService.getBookById(bookId)
        .then((data) => {
          const digitalFormat = data.formats?.find(
            (f) => f.type === "DIGITAL" || f.format_type === "DIGITAL"
          );
          setBook({
            id: data.id,
            book_id: data.id,
            book_title: data.title,
            title: data.title,
            author: data.author_name,
            cover_image_url: data.cover_image_url,
            pdf_url: digitalFormat?.file_url || "/k2.pdf",
          });
        })
        .catch((err) => {
          console.warn("Could not fetch book details:", err);
          setBookError("Unable to load book details from server. Loading fallback document.");
        })
        .finally(() => {
          setIsLoadingBook(false);
        });
    }
  }, [book, bookId]);

  // Derived state
  const isFirstPage = pageNumber <= 1;
  const isLastPage = pageNumber >= (numPages || 1);

  // Document load handlers
  const onDocumentLoadSuccess = useCallback(
    ({ numPages: loadedPages }) => {
      setNumPages(loadedPages);
      setIsLoadingDoc(false);

      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const p = parseInt(saved, 10);
          if (!isNaN(p) && p >= 1 && p <= loadedPages) {
            setPageNumber(p);
            setJumpInput(String(p));
            if (p > 1) {
              setResumeToast(`Resumed reading from page ${p}`);
              setTimeout(() => setResumeToast(""), 3500);
            }
            return;
          }
        }
      }
      setPageNumber(1);
      setJumpInput("1");
    },
    [storageKey]
  );

  const onDocumentLoadError = useCallback((error) => {
    console.error("Failed to load PDF:", error);
    setIsLoadingDoc(false);
  }, []);

  // Page navigation
  const goToPage = useCallback(
    (page) => {
      const targetPage = Math.min(Math.max(1, page), numPages || 1);
      setPageNumber(targetPage);
      setJumpInput(String(targetPage));
      if (storageKey) {
        localStorage.setItem(storageKey, String(targetPage));
      }
    },
    [numPages, storageKey]
  );

  const nextPage = useCallback(() => {
    if (!isLastPage) {
      goToPage(pageNumber + 1);
    }
  }, [isLastPage, goToPage, pageNumber]);

  const prevPage = useCallback(() => {
    if (!isFirstPage) {
      goToPage(pageNumber - 1);
    }
  }, [isFirstPage, goToPage, pageNumber]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(numPages || 1);
  }, [goToPage, numPages]);

  const handleJumpSubmit = (e) => {
    if (e.key === "Enter" || e.type === "blur") {
      const target = parseInt(jumpInput, 10);
      if (!isNaN(target)) {
        goToPage(target);
      } else {
        setJumpInput(String(pageNumber));
      }
    }
  };

  // Zoom controls
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(Math.round((prev + 0.15) * 100) / 100, 2.5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(Math.round((prev - 0.15) * 100) / 100, 0.6));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ignore when user is typing in input
      if (["INPUT", "TEXTAREA"].includes(event.target.tagName)) {
        return;
      }

      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
      }

      if (KEYBOARD_NAVIGATION_KEYS.NEXT.includes(event.key)) {
        nextPage();
      } else if (KEYBOARD_NAVIGATION_KEYS.PREV.includes(event.key)) {
        prevPage();
      } else if (KEYBOARD_NAVIGATION_KEYS.HOME.includes(event.key)) {
        event.preventDefault();
        goToFirstPage();
      } else if (KEYBOARD_NAVIGATION_KEYS.END.includes(event.key)) {
        event.preventDefault();
        goToLastPage();
      } else if (event.key === "+" || event.key === "=") {
        zoomIn();
      } else if (event.key === "-" || event.key === "_") {
        zoomOut();
      } else if (event.key === "0") {
        resetZoom();
      } else if (event.key.toLowerCase() === "f") {
        toggleFullscreen();
      } else if (event.key === "Escape" && !document.fullscreenElement) {
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFullscreen,
    navigate,
  ]);

  const pdfSource = book?.pdf_url || book?.file_url || "/k2.pdf";

  return (
    <div className="pdf-container" ref={containerRef}>
      <div className="pdf-content">
        {/* Top Header Bar */}
        <header className="pdf-top-bar">
          <div className="pdf-nav-buttons">
            <button
              type="button"
              className="pdf-btn pdf-btn-secondary"
              onClick={() => navigate(-1)}
              title="Go Back"
            >
              ← Back
            </button>
            <button
              type="button"
              className="pdf-btn pdf-btn-secondary"
              onClick={() => navigate("/dashboard")}
              title="Return to Dashboard"
            >
              Dashboard
            </button>
            <Link to="/home" className="pdf-btn pdf-btn-secondary" title="Store Home">
              Store
            </Link>
          </div>

          <div className="pdf-title-block">
            <h1 className="pdf-title">{book?.book_title || book?.title || "PDF Reader"}</h1>
            {book?.author && <p className="pdf-author">by {book.author}</p>}
          </div>

          <div className="pdf-top-tools">
            <ThemeToggle page="pdf" />
            <button
              type="button"
              className="pdf-btn pdf-btn-icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            >
              {isFullscreen ? "🗗 Exit" : "⛶ Fullscreen"}
            </button>
          </div>
        </header>

        {bookError && (
          <div className="pdf-notice-banner warning">
            <span>⚠️ {bookError}</span>
          </div>
        )}

        {resumeToast && (
          <div className="pdf-notice-banner info">
            <span>🔖 {resumeToast}</span>
          </div>
        )}

        {/* Toolbar: Page controls + Zoom controls */}
        <div className="pdf-toolbar">
          <div className="pdf-toolbar-group page-controls">
            <button
              type="button"
              onClick={goToFirstPage}
              disabled={isFirstPage}
              className="pdf-btn pdf-btn-tool"
              title="First Page (Home)"
            >
              ⇤
            </button>
            <button
              type="button"
              onClick={prevPage}
              disabled={isFirstPage}
              className="pdf-btn pdf-btn-tool"
              title="Previous Page (←)"
            >
              ◀ Prev
            </button>

            <div className="pdf-page-jump">
              <input
                type="number"
                min={1}
                max={numPages || 1}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onKeyDown={handleJumpSubmit}
                onBlur={handleJumpSubmit}
                className="pdf-page-input"
                aria-label="Current Page"
              />
              <span className="pdf-page-total">of {numPages || "..."}</span>
            </div>

            <button
              type="button"
              onClick={nextPage}
              disabled={isLastPage}
              className="pdf-btn pdf-btn-tool"
              title="Next Page (→)"
            >
              Next ▶
            </button>
            <button
              type="button"
              onClick={goToLastPage}
              disabled={isLastPage}
              className="pdf-btn pdf-btn-tool"
              title="Last Page (End)"
            >
              ⇥
            </button>
          </div>

          <div className="pdf-toolbar-divider" />

          <div className="pdf-toolbar-group zoom-controls">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.6}
              className="pdf-btn pdf-btn-tool"
              title="Zoom Out (-)"
            >
              −
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="pdf-btn pdf-btn-tool zoom-val"
              title="Reset Zoom (0)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 2.5}
              className="pdf-btn pdf-btn-tool"
              title="Zoom In (+)"
            >
              +
            </button>
          </div>
        </div>

        {/* Document Viewer Canvas */}
        <div className="pdf-document-wrapper">
          {isLoadingBook ? (
            <div className="pdf-loading-state">
              <div className="pdf-spinner" />
              <p>Fetching book details...</p>
            </div>
          ) : (
            <Document
              file={pdfSource}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="pdf-loading-state">
                  <div className="pdf-spinner" />
                  <p>Loading document pages...</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pdf-rendered-page"
              />
            </Document>
          )}

          {isLoadingDoc && !isLoadingBook && (
            <div className="pdf-loading-state">
              <div className="pdf-spinner" />
              <p>Rendering page {pageNumber}...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}