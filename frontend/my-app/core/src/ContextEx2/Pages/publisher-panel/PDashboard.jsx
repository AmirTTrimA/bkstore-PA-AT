import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Profile from '../dashboard/profile/Profile';
import Authors from './authors/Authors';
import Upload from './Upload';
import NotifModal from './NotifModal';
import Notification from '../../Components/feature/Notification';
import { ThemeToggle } from '../../Components/common/ThemeToggle';
import { LanguageToggle } from '../../Components/common/LanguageToggle';
import { useAuth } from '../../Context/AuthContext';
import { useLanguage } from '../../Context/LanguageContext';
import PublisherService from '../../Services/PublisherService';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMyPublishers,
  usePublisherBooks,
  usePublisherProposals,
  queryKeys,
} from '../../Hooks/queries';
import { ppic14 } from '../../Constants';
import { formatPrice } from '../../utils/formatPrice';

import '../../Styles/publisher-panel/PDashboard.css';

const SEARCH_MIN_LENGTH = 2;
const HIGHLIGHT_DURATION = 4000;

export default function PDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const queryClient = useQueryClient();

  // Core publisher state via React Query
  const { data: publishersData = [] } = useMyPublishers();
  const publishers = useMemo(() => {
    return Array.isArray(publishersData) ? publishersData : [];
  }, [publishersData]);

  const [selectedPublisherId, setSelectedPublisherId] = useState(null);
  const currentPublisher = useMemo(() => {
    if (selectedPublisherId) {
      return publishers.find((p) => p.id === selectedPublisherId) || publishers[0] || null;
    }
    return publishers[0] || null;
  }, [publishers, selectedPublisherId]);

  const setCurrentPublisher = (pub) => {
    setSelectedPublisherId(pub?.id || null);
  };

  const { data: rawBooks = [] } = usePublisherBooks(currentPublisher?.id);
  const { data: rawProposals = [] } = usePublisherProposals(currentPublisher?.id);

  const allbooks = useMemo(() => {
    const list = Array.isArray(rawBooks) ? rawBooks : (rawBooks?.results || []);
    return list.map((b) => ({
      id: b.id,
      name: b.title || 'Untitled',
      title: b.title || 'Untitled',
      author: b.author_name || (typeof b.author === 'string' ? b.author : b.author?.name) || 'Unknown',
      author_name: b.author_name || (typeof b.author === 'string' ? b.author : b.author?.name) || 'Unknown',
      author_id: b.author_id || (typeof b.author === 'object' ? b.author?.id : null),
      formats: b.formats || [],
      type: b.formats && b.formats.length > 0 ? b.formats.map((f) => f.type).join(', ') : 'Physical',
      price: b.price || (b.formats && b.formats[0]?.price) || '0',
      genre: b.genre || 'FICTION',
      aboutbook: b.description || '',
      description: b.description || '',
      bookImage: b.cover_image_url || '',
      cover_image_url: b.cover_image_url || '',
      isbn: b.isbn || '',
      raw: b,
    }));
  }, [rawBooks]);

  const proposals = useMemo(() => {
    return Array.isArray(rawProposals) ? rawProposals : (rawProposals?.results || []);
  }, [rawProposals]);

  const refreshPublisherData = useCallback(() => {
    if (currentPublisher?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.publishers.books(currentPublisher.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.publishers.proposals(currentPublisher.id) });
    }
  }, [currentPublisher?.id, queryClient]);

  const [bookToEdit, setBookToEdit] = useState(null);

  // Active view: 'mybook' | 'upload' | 'authors' | 'proposals'
  const [activeTab, setActiveTab] = useState('mybook');

  // Search & highlight
  const [searchInputValue, setSearchInputValue] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Proposals waiting list filter
  const [proposalFilter, setProposalFilter] = useState('ALL');
  const [confirmWithdrawId, setConfirmWithdrawId] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Modals & mobile
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const rowRefs = useRef({});
  const notificationRef = useRef();

  const username = user?.username || 'Publisher';

  // Pending proposal counter for bell icon badge
  const pendingCount = useMemo(() => {
    return proposals.filter((p) => p.status === 'PENDING').length;
  }, [proposals]);

  // Clear highlight timer
  useEffect(() => {
    if (selectedRowId) {
      const timer = setTimeout(() => {
        setSelectedRowId(null);
      }, HIGHLIGHT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [selectedRowId]);

  // Handle Book Search Filter
  const filteredBooks = useMemo(() => {
    if (!searchInputValue.trim() || searchInputValue.length < SEARCH_MIN_LENGTH) {
      return allbooks;
    }
    const val = searchInputValue.toLowerCase().trim();
    return allbooks.filter(
      (b) =>
        b.name?.toLowerCase().includes(val) ||
        b.author?.toLowerCase().includes(val) ||
        b.genre?.toLowerCase().includes(val) ||
        b.isbn?.toLowerCase().includes(val)
    );
  }, [allbooks, searchInputValue]);

  const handleEditBook = useCallback((book) => {
    setBookToEdit(book);
    setActiveTab('upload');
  }, []);

  const handleClearEditMode = useCallback(() => {
    setBookToEdit(null);
  }, []);

  const handleWithdrawProposal = useCallback(
    async (proposalId) => {
      setIsWithdrawing(true);
      try {
        await PublisherService.withdrawProposal(proposalId, 'Withdrawn by publisher');
        notificationRef.current?.showNotif('Proposal withdrawn successfully.', 'info');
        setConfirmWithdrawId(null);
        refreshPublisherData();
      } catch (err) {
        console.error('Failed to withdraw proposal:', err);
        notificationRef.current?.showNotif('Failed to withdraw proposal.', 'error');
      } finally {
        setIsWithdrawing(false);
      }
    },
    [refreshPublisherData]
  );

  // Proposals waiting list filtered items
  const filteredProposals = useMemo(() => {
    if (proposalFilter === 'ALL') return proposals;
    if (proposalFilter === 'APPROVED') {
      return proposals.filter((p) => p.status === 'APPROVED' || p.status === 'APPLIED');
    }
    return proposals.filter((p) => p.status === proposalFilter);
  }, [proposals, proposalFilter]);

  const getProposalTypeInfo = (type) => {
    switch (type) {
      case 'BOOK_CREATE':
        return { label: '📖 New Book', className: 'book_create' };
      case 'BOOK_UPDATE':
        return { label: '✏️ Book Update', className: 'book_update' };
      case 'PRICE_CHANGE':
        return { label: '💰 Price Change', className: 'price_change' };
      case 'AUTHOR_CREATE':
        return { label: '👤 New Author', className: 'author_create' };
      case 'AUTHOR_UPDATE':
        return { label: '📝 Author Update', className: 'author_update' };
      default:
        return { label: '📋 Proposal', className: 'generic' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="proposal-status-chip pending">⏳ {t('publisher_panel.underReview', 'Under Review')}</span>;
      case 'APPROVED':
      case 'APPLIED':
        return <span className="proposal-status-chip approved">✅ {t('publisher_panel.approved', 'Approved')}</span>;
      case 'REJECTED':
        return <span className="proposal-status-chip rejected">❌ {t('publisher_panel.rejected', 'Rejected')}</span>;
      case 'WITHDRAWN':
        return <span className="proposal-status-chip withdrawn">↩️ {t('publisher_panel.withdrawn', 'Withdrawn')}</span>;
      default:
        return <span className="proposal-status-chip">{status}</span>;
    }
  };

  return (
    <div className="pdashboard-wrapper">
      {/* --------------------------------------------
          Site-Wide Aligned Top Navigation Bar
         -------------------------------------------- */}
      <header className="pdashboard-topbar">
        <div className="pdashboard-topbar-inner">
          {/* Left: Branding & Publisher Switcher */}
          <div className="pdashboard-topbar-left">
            <Link to="/home" className="pdashboard-logo" title={t('publisher_panel.backStorefront', 'Back to Storefront')}>
              <span className="brand-dot">●</span> {t('nav.brandName', 'Bookkadeh')}
            </Link>

          <div className="pdashboard-user-greeting">
            {t('publisher_panel.welcome', 'Welcome, {name}', { name: username })}
          </div>

          {currentPublisher && (
            <div className="publisher-selector-box">
              <span className="publisher-badge-icon">🏢</span>
              {publishers.length > 1 ? (
                <select
                  className="publisher-dropdown-select"
                  value={currentPublisher.id}
                  onChange={(e) => {
                    const selected = publishers.find(
                      (p) => p.id === parseInt(e.target.value, 10)
                    );
                    if (selected) setCurrentPublisher(selected);
                  }}
                  aria-label="Select Publisher House"
                >
                  {publishers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role || 'Publisher'})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="publisher-badge-text">
                  {currentPublisher.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions, Notifications, Profile, Theme, Logout */}
        <div className="pdashboard-topbar-right">
          <Link to="/dashboard" className="pdash-btn" title="Go to Reader Dashboard">
            {t('dashboard.readerShelf', 'Reader Shelf')}
          </Link>
          <Link to="/home" className="pdash-btn" title="Return to Customer Storefront">
            {t('publisher_panel.storefront', 'Storefront')}
          </Link>

          {/* Notifications Bell */}
          <button
            type="button"
            className="notif-bell-btn"
            onClick={() => setNotifModal(true)}
            title="Proposals & Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {pendingCount > 0 && (
              <span className="notif-count-badge">{pendingCount}</span>
            )}
          </button>

          {/* Profile Modal Trigger */}
          <button
            type="button"
            className="pdash-btn"
            onClick={() => setIsModalOpen(true)}
            title="Publisher Account Settings"
          >
            {t('dashboard.profile', 'Profile')}
          </button>

          {/* Language Toggle */}
          <LanguageToggle page="dash" />

          {/* Theme Toggle */}
          <ThemeToggle page="dash" />

          {/* Logout Button */}
          <button
            type="button"
            className="pdash-btn pdash-btn-logout"
            onClick={logout}
            title="Log Out"
          >
            {t('nav.logout', 'Logout')}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        </div>
      </header>

      {/* --------------------------------------------
          Main Dashboard Container
         -------------------------------------------- */}
      <main className="pdashboard-main">
        {/* KPI Summary Cards Strip */}
        <section className="pdashboard-kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon-wrapper">📚</div>
            <div className="kpi-info-col">
              <span className="kpi-label">{t('publisher_panel.publishedTitles', 'Published Titles')}</span>
              <span className="kpi-value">{allbooks.length}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper">⏳</div>
            <div className="kpi-info-col">
              <span className="kpi-label">{t('publisher_panel.pendingProposals', 'Pending Proposals')}</span>
              <span className="kpi-value">{pendingCount}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper">✍️</div>
            <div className="kpi-info-col">
              <span className="kpi-label">{t('publisher_panel.rosterAuthors', 'Roster Authors')}</span>
              <span className="kpi-value">
                {currentPublisher?.authors_count ?? '—'}
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper">🏢</div>
            <div className="kpi-info-col">
              <span className="kpi-label">{t('publisher_panel.publisherRole', 'Publisher Role')}</span>
              <span className="kpi-value" style={{ fontSize: '1.15rem' }}>
                {currentPublisher?.role || 'Owner'}
              </span>
            </div>
          </div>
        </section>

        {/* In-Page Navigation Tabs */}
        <nav className="pdashboard-tabs-bar" aria-label="Publisher Navigation">
          <button
            type="button"
            className={`pdash-tab-btn ${activeTab === 'mybook' ? 'active' : ''}`}
            onClick={() => {
              handleClearEditMode();
              setActiveTab('mybook');
            }}
          >
            {t('publisher_panel.publishedBooks', 'Published Books')}
            <span className="tab-badge">{allbooks.length}</span>
          </button>

          <button
            type="button"
            className={`pdash-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            {bookToEdit ? t('publisher_panel.editBookFormats', 'Edit Book & Formats') : t('publisher_panel.bookProposalEditor', 'Book Proposal & Editor')}
          </button>

          <button
            type="button"
            className={`pdash-tab-btn ${activeTab === 'authors' ? 'active' : ''}`}
            onClick={() => setActiveTab('authors')}
          >
            {t('publisher_panel.authorsManagement', 'Authors Management')}
          </button>

          <button
            type="button"
            className={`pdash-tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposals')}
          >
            {t('publisher_panel.proposalsWaitingList', 'Proposals Waiting List')}
            {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
          </button>
        </nav>

        {/* --------------------------------------------
            Tab 1: Published Books Catalog
           -------------------------------------------- */}
        {activeTab === 'mybook' && (
          <div className="pdash-card">
            <div className="pdash-card-header">
              <h2 className="pdash-card-title">
                <span>📚 {t('publisher_panel.catalogFor', 'Catalog Books for {name}', { name: currentPublisher?.name || 'Publisher' })}</span>
              </h2>

              <div className="pdash-table-search">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder={t('publisher_panel.filterPlaceholder', 'Filter by title, author, isbn...')}
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                />
              </div>
            </div>

            <div className="pdash-table-container">
              <table className="pdash-table">
                <thead>
                  <tr>
                    <th>{t('publisher_panel.bookCol', 'Book')}</th>
                    <th>{t('publisher_panel.authorCol', 'Author')}</th>
                    <th>{t('publisher_panel.formatsOffered', 'Formats Offered')}</th>
                    <th>{t('publisher_panel.basePrice', 'Base Price')}</th>
                    <th style={{ textAlign: 'right' }}>{t('publisher_panel.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        {searchInputValue
                          ? t('publisher_panel.noBooksMatching', 'No books matching "{query}".', { query: searchInputValue })
                          : t('publisher_panel.noBooksSubmit', 'No books found for this publisher. Submit a new book creation proposal to get started!')}
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map((book) => {
                      const rawFmts = book.formats || [];
                      const hasPhysical = rawFmts.some((f) => f.type === 'PHYSICAL') || (!book.raw?.is_digital && !book.raw?.is_audio);
                      const hasDigital = rawFmts.some((f) => f.type === 'DIGITAL') || book.raw?.is_digital;
                      const hasAudio = rawFmts.some((f) => f.type === 'AUDIO') || book.raw?.is_audio;

                      return (
                        <tr
                          key={book.id}
                          ref={(el) => {
                            rowRefs.current[book.id] = el;
                          }}
                          style={
                            selectedRowId === book.id
                              ? { backgroundColor: 'rgba(209, 120, 66, 0.15)' }
                              : {}
                          }
                        >
                          <td>
                            <div className="book-title-cell">
                              <img
                                src={book.bookImage || ppic14}
                                alt={book.title}
                                className="book-thumb-img"
                                onError={(e) => {
                                  e.currentTarget.src = ppic14;
                                }}
                              />
                              <div className="book-meta-info">
                                <span className="book-main-title">{book.title}</span>
                                {book.isbn && (
                                  <span className="book-sub-author">ISBN: {book.isbn}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>{book.author}</td>

                          <td>
                            <div className="format-tags-row">
                              {hasPhysical && <span className="format-pill physical">📦 {t('book.physical', 'Print')}</span>}
                              {hasDigital && <span className="format-pill digital">📄 {t('book.digital', 'Digital')}</span>}
                              {hasAudio && <span className="format-pill audio">🎧 {t('book.audio', 'Audio')}</span>}
                            </div>
                          </td>

                          <td>
                            <span className="price-text">{formatPrice(book.price)}</span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="table-action-btn"
                              onClick={() => handleEditBook(book)}
                              title={t('publisher_panel.editDetailsTitle', 'Modify details or format prices')}
                            >
                              {t('publisher_panel.editAndFormats', 'Edit & Formats')}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------------------------------
            Tab 2: Book Upload & Multi-Format Editor
           -------------------------------------------- */}
        {activeTab === 'upload' && (
          <div className="pdash-card">
            <Upload
              bookToEdit={bookToEdit}
              clearEditMode={handleClearEditMode}
              PageChanger={(tab) => {
                handleClearEditMode();
                setActiveTab(tab);
              }}
              currentPublisher={currentPublisher}
              onProposalCreated={() => {
                refreshPublisherData();
              }}
            />
          </div>
        )}

        {/* --------------------------------------------
            Tab 3: Publisher Authors Management
           -------------------------------------------- */}
        {activeTab === 'authors' && (
          <div className="pdash-card">
            <Authors
              currentPublisher={currentPublisher}
              onProposalCreated={() => {
                refreshPublisherData();
              }}
            />
          </div>
        )}

        {/* --------------------------------------------
            Tab 4: Proposals Waiting List & Activity
           -------------------------------------------- */}
        {activeTab === 'proposals' && (
          <div className="pdash-card">
            <div className="pdash-card-header">
              <h2 className="pdash-card-title">
                <span>⏳ {t('publisher_panel.proposalsWaitingList', 'Proposals Waiting List & Activity')}</span>
              </h2>

              <div className="proposals-filter-strip" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`proposal-filter-chip ${proposalFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setProposalFilter('ALL')}
                >
                  {t('common.all', 'All')} ({proposals.length})
                </button>
                <button
                  type="button"
                  className={`proposal-filter-chip ${proposalFilter === 'PENDING' ? 'active' : ''}`}
                  onClick={() => setProposalFilter('PENDING')}
                >
                  {t('publisher_panel.pending', 'Pending')} ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`proposal-filter-chip ${proposalFilter === 'APPROVED' ? 'active' : ''}`}
                  onClick={() => setProposalFilter('APPROVED')}
                >
                  {t('publisher_panel.approved', 'Approved')} ({proposals.filter((p) => p.status === 'APPROVED' || p.status === 'APPLIED').length})
                </button>
                <button
                  type="button"
                  className={`proposal-filter-chip ${proposalFilter === 'REJECTED' ? 'active' : ''}`}
                  onClick={() => setProposalFilter('REJECTED')}
                >
                  {t('publisher_panel.rejected', 'Rejected')} ({proposals.filter((p) => p.status === 'REJECTED').length})
                </button>
              </div>
            </div>

            <div className="proposals-cards-list">
              {filteredProposals.length === 0 ? (
                <div className="empty-roster-state" style={{ margin: '30px 0' }}>
                  <p>{t('publisher_panel.noProposals', 'No proposals found in this category.')}</p>
                </div>
              ) : (
                filteredProposals.map((item) => {
                  const typeInfo = getProposalTypeInfo(item.proposal_type);
                  const isPending = item.status === 'PENDING';
                  const submittedDate = item.submitted_at || item.created_at;
                  const formattedDate = submittedDate
                    ? new Date(submittedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Date unknown';

                  return (
                    <div key={item.id} className="proposal-card-item">
                      <div className="proposal-card-top">
                        <span className={`proposal-type-badge ${typeInfo.className}`}>
                          {typeInfo.label}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>

                      <div>
                        <h4 className="proposal-item-title">{item.title}</h4>
                        <div className="proposal-item-meta" style={{ marginTop: 6 }}>
                          <span>📅 {t('publisher_panel.submitted', 'Submitted')}: {formattedDate}</span>
                          {item.submitted_by_username && (
                            <span>👤 {t('publisher_panel.submitter', 'Submitter')}: {item.submitted_by_username}</span>
                          )}
                          {item.proposal_type === 'PRICE_CHANGE' && item.details?.value && (
                            <span>
                              💰 {t('publisher_panel.proposedPrice', 'Proposed Price')}: <strong>{formatPrice(item.details.value)}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Admin review notes */}
                      {item.review_notes && (
                        <div
                          className={`admin-review-box ${
                            item.status === 'REJECTED' ? 'rejected-box' : ''
                          }`}
                        >
                          <strong>{t('publisher_panel.editorialFeedback', 'Editorial Feedback')}:</strong> {item.review_notes}
                        </div>
                      )}

                      {/* Withdraw Action for Pending */}
                      {isPending && (
                        <div className="proposal-card-actions">
                          {confirmWithdrawId === item.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.8rem', color: '#f87171' }}>
                                {t('publisher_panel.confirmWithdrawal', 'Confirm withdrawal?')}
                              </span>
                              <button
                                type="button"
                                className="withdraw-btn"
                                style={{ background: '#ef4444', color: '#fff' }}
                                onClick={() => handleWithdrawProposal(item.id)}
                                disabled={isWithdrawing}
                              >
                                {isWithdrawing ? t('common.loading', 'Withdrawing...') : t('publisher_panel.yesWithdraw', 'Yes, Withdraw')}
                              </button>
                              <button
                                type="button"
                                className="pdash-btn"
                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                onClick={() => setConfirmWithdrawId(null)}
                              >
                                {t('common.cancel', 'Cancel')}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="withdraw-btn"
                              onClick={() => setConfirmWithdrawId(item.id)}
                              title={t('publisher_panel.withdrawTitle', 'Withdraw proposal from admin review queue')}
                            >
                              {t('publisher_panel.withdrawProposal', 'Withdraw Proposal')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* --------------------------------------------
          Modals
         -------------------------------------------- */}
      {isModalOpen && (
        <Profile open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}

      {notifModal && (
        <NotifModal
          open={notifModal}
          onClose={() => setNotifModal(false)}
          notifmessage={proposals}
          onWithdraw={handleWithdrawProposal}
        />
      )}

      <Notification ref={notificationRef} />
    </div>
  );
}