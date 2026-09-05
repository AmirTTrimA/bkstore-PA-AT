import React, { useState, useEffect, useCallback } from "react";
import { Document, Page } from "react-pdf";
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from "../common/ThemeToggle";

import "../../../pdf-worker"; 
import "../../Styles/components/PDFReader.css"; 


// ============================================
// Constants
// ============================================
const KEYBOARD_NAVIGATION_KEYS = {
  NEXT: ['ArrowRight', 'ArrowUp'],
  PREV: ['ArrowLeft', 'ArrowDown'],
  HOME: ['Home'],
  END: ['End'],
};



// ============================================
//    Main Component
// ============================================
export default function PDFReader() {

  const navigate = useNavigate();
  const location = useLocation();
  const book = location.state?.book;

  // ---States---
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);


    // ---Derived State---
    const isFirstPage = pageNumber <= 1;
    const isLastPage = pageNumber >= (numPages || 1);

    // ---Document Handlers---
    const onDocumentLoadSuccess =useCallback(({ numPages }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setPageNumber(1);
    },[]);

    const onDocumentLoadError = useCallback((error) => {
      console.error('Failed to load PDF:', error);
      setIsLoading(false);
    }, []);


    // ---Page Navigations---
    
    // prev-next
    const nextPage = useCallback(() => {
      if (!isLastPage) {
        setPageNumber(prev => prev + 1);
      }
    }, [isLastPage]);


    const prevPage = useCallback(() => {
      if (!isFirstPage) {
        setPageNumber(prev => prev - 1);
      }
    }, [isFirstPage]);



    // back-exactpage
    const goBack = useCallback(() => {
      navigate(-1)
    }, [navigate]);

      
      const goToPage = useCallback((page) => {
        const targetPage = Math.min(Math.max(1, page), numPages || 1);
        setPageNumber(targetPage);
      }, [numPages]);



    // first-last
    const goToFirstPage = useCallback(() => {
      goToPage(1);
    }, [goToPage]);


    const goToLastPage = useCallback(() => {
      goToPage(numPages || 1);
    }, [goToPage,numPages]);









    // ---Keyboard Navigation---
    useEffect(() => {
        const handleKeyPress = (event) => {
          // for arrow keys to avoid page scroll
          if (event.key.startsWith('Arrow')) {
            event.preventDefault();
          }
        
          // Next
          if (KEYBOARD_NAVIGATION_KEYS.NEXT.includes(event.key)) {
            nextPage();
          }
          // Prev
          else if (KEYBOARD_NAVIGATION_KEYS.PREV.includes(event.key)) {
            prevPage();
          }
          // Home
          else if (KEYBOARD_NAVIGATION_KEYS.HOME.includes(event.key)) {
            event.preventDefault();
            goToFirstPage();
          }
          // End
          else if (KEYBOARD_NAVIGATION_KEYS.END.includes(event.key)) {
            event.preventDefault();
            goToLastPage();
          }
          // Escape
          else if (event.key === 'Escape') {
            goBack();
          }
        };
      
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [nextPage, prevPage, goToFirstPage, goToLastPage, goBack]);


  return (
    <div className="pdf-container">
      <div className="pdf-content">
        <h2 className="pdf-title">{book?.book_title || "PDF Viewer"}</h2>
        {book?.author && (
          <p style={{ color: "var(--text-primarys)", marginTop: "-12px", marginBottom: "16px", opacity: 0.8 }}>
            by {book.author}
          </p>
        )}
        
        <div className="controls">
          <button 
            onClick={prevPage} 
            disabled={isFirstPage}
            className="control-btn"
          >
             Prev
          </button>
          
          <div className="page-info">
            <span>Page {pageNumber}</span>
            {numPages && <span> of {numPages}</span>}
          </div>
          
          <button 
            onClick={nextPage} 
            disabled={isLastPage}
            className="control-btn"
          >
            Next
          </button>
          


          <button onClick={goToFirstPage} className="control-btn reset-btn">
            First
          </button>
          <button onClick={goToLastPage} className="control-btn reset-btn">
            Last
          </button> 
          <button onClick={() => navigate("/dashboard")} className="control-btn back-btn">
            ← Dashboard
          </button>

        </div>
        
        <div className="document-wrapper">

          <Document
            file={book?.pdf_url || book?.file_url || "/k2.pdf"}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading="Loading document..."
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="pdf-page"
            />
          </Document>
            {isLoading && numPages === 0 && (
             <div className="loading">
              <p> No pages found</p>
             </div>
             )}
        </div>

        <ThemeToggle page="pdf" />
        
      </div>
    </div>
  );
}