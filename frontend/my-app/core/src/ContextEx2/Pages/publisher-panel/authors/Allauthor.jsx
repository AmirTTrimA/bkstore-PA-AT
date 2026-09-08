import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Notification from '../../../Components/feature/Notification';
import PublisherService from '../../../Services/PublisherService';

import '../../../Styles/publisher-panel/Allauthor.css';

export default function Allauthor({ onEditAuthor, onAddNew }) {
  const [allAuthors, setAllAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const notificationRef = useRef();

  const loadAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await PublisherService.getAuthors();
      setAllAuthors(data || []);
    } catch (err) {
      console.error('Failed to load authors:', err);
      notificationRef.current?.showNotif('Failed to load authors roster.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  const filteredAuthors = useMemo(() => {
    if (!searchTerm.trim()) return allAuthors;
    const term = searchTerm.toLowerCase();
    return allAuthors.filter(
      (a) =>
        a.name?.toLowerCase().includes(term) ||
        a.biography?.toLowerCase().includes(term) ||
        a.bio_summary?.toLowerCase().includes(term)
    );
  }, [allAuthors, searchTerm]);

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleDeleteAuthors = () => {
    notificationRef.current?.showNotif(
      'Author records are catalog-wide. Direct deletion is restricted to administrative staff.',
      'info'
    );
  };

  return (
    <div className="all-authors-view">
      {/* Header with Search and New Author Shortcut */}
      <div className="all-authors-header-bar">
        <div className="authors-search-input-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search author by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="pdash-btn"
          onClick={onAddNew}
          style={{ background: 'rgba(209, 120, 66, 0.15)', borderColor: '#d17842', color: '#d17842' }}
        >
          + Propose New Author
        </button>
      </div>

      {loading ? (
        <div className="empty-roster-state">
          <p>Loading authors roster...</p>
        </div>
      ) : filteredAuthors.length === 0 ? (
        <div className="empty-roster-state">
          <p>
            {searchTerm
              ? `No authors found matching "${searchTerm}".`
              : 'No authors currently on roster. Propose a new author to get started!'}
          </p>
        </div>
      ) : (
        <div className="authors-grid-layout">
          {filteredAuthors.map((author) => (
            <div key={author.id} className="author-roster-card">
              <div>
                <div className="author-card-header">
                  <div className="author-avatar-circle">
                    {getInitials(author.name)}
                  </div>
                  <div className="author-card-info">
                    <span className="author-card-name" title={author.name}>
                      {author.name}
                    </span>
                    <span className="author-books-badge">
                      📚 {author.books_count ?? 0} Published Books
                    </span>
                  </div>
                </div>

                <p className="author-card-bio" style={{ marginTop: 12 }}>
                  {author.biography || author.bio_summary || 'No biography provided for this author yet.'}
                </p>
              </div>

              <div className="author-card-actions">
                <button
                  type="button"
                  className="author-edit-btn"
                  onClick={() => onEditAuthor(author)}
                  title="Submit an author update proposal"
                >
                  ✏️ Edit Proposal
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAuthors}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                  title="Author deletion is governed by store administrators"
                >
                  ℹ️ Policy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Notification ref={notificationRef} />
    </div>
  );
}
