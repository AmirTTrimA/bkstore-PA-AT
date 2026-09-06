import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Notification from '../../../Components/feature/Notification';
import PublisherService from '../../../Services/PublisherService';
import "../../../Styles/publisher-panel/Allauthor.css"

// ============================================
//    Main 
// ============================================
export default function Allauthor({ onEditAuthor }) {

  //---State---
  const [allauthor, setAllAuthor] = useState([]);
  const [loading, setLoading] = useState(true);

  //---Ref---
  const notificationRef = useRef();

  // ---Memoized Values---
  const hasAuthors = useMemo(() => allauthor.length > 0, [allauthor]);

//---Effects---

  const loadAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const authorsData = await PublisherService.getAuthors();
      setAllAuthor(authorsData || []);
    } catch (err) {
      console.error('Failed to load authors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  //---Handlers--- 
  const handleDeleteAuthors = useCallback((authorId) => {
    notificationRef.current.showNotif('Author deletion is restricted to administrative staff.', 'info');
  }, []);

  const handleEditAuthors = useCallback((author) => {
    if (onEditAuthor) {
      onEditAuthor(author);
    }
  }, [onEditAuthor]);

  if (loading) {
    return (
      <div className="edit-authors-container">
        <div className="all-authors-container">
          <div className="empty-authors-list">
            <p>Loading authors...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAuthors) {
    return (
      <div className="edit-authors-container">
        <div className="all-authors-container">
          <div className="empty-authors-list">
            <p>No authors found. Create an author proposal to add one!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="all-authors-container">
      {allauthor.map(auth => (
        <div key={auth.id} className="authors-profile">
          {/* Left Side - Action Buttons */}
          <div className="authors-profile-leftside">
            {/* Edit Button */}
            <button
              onClick={() => handleEditAuthors(auth)}
              className='edit-authors-icon'
              title="Edit author"
            >
              <svg 
                width="22px" 
                height="22px" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                <path d="M4 20h16" />
              </svg>
            </button>
            {/* Delete Button */}
            <button 
              className='remove-btn'
              onClick={() => handleDeleteAuthors(auth.id)}
              title="Delete author"
            >
              <svg 
                width="22"
                height="22" 
                viewBox="0 0 24 24" 
                fill="none"  
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>

          {/* Right Side - Author Info */}
          <div className="authors-profile-rightside">
            <div className="authors-profile-rightside-name">
              {auth.name}
            </div>
            <div className="authors-profile-rightside-book-number">
              {auth.books_count ?? 0} books
              {auth.bio_summary && ` • ${auth.bio_summary}`}
            </div>
          </div>
        </div>           
      ))}
      <Notification ref={notificationRef} />
    </div>
  );
}

