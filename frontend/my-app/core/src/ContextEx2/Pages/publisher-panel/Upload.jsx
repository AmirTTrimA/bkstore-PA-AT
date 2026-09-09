import React, { useEffect, useState, useRef } from 'react';
import Notification from '../../Components/feature/Notification';
import { useLanguage } from '../../Context/LanguageContext';
import PublisherService from '../../Services/PublisherService';
import { ppic14 } from '../../Constants';
import { formatPrice } from '../../utils/formatPrice';

import '../../Styles/publisher-panel/Upload.css';

const GENRE_OPTIONS = [
  { value: 'FICTION', label: 'Fiction' },
  { value: 'NON_FICTION', label: 'Non-Fiction' },
  { value: 'SCIENCE_FICTION', label: 'Science Fiction' },
  { value: 'FANTASY', label: 'Fantasy' },
  { value: 'MYSTERY', label: 'Mystery & Thriller' },
  { value: 'BIOGRAPHY', label: 'Biography' },
  { value: 'HISTORY', label: 'History' },
  { value: 'TECH', label: 'Technology & Science' },
  { value: 'ROMANCE', label: 'Romance' },
  { value: 'CHILDREN', label: 'Children' },
];

export default function Upload({
  bookToEdit,
  clearEditMode,
  PageChanger,
  currentPublisher,
  onProposalCreated,
}) {
  const { t } = useLanguage();
  const notificationRef = useRef();

  // Core metadata state
  const [title, setTitle] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [isbn, setIsbn] = useState('');
  const [genre, setGenre] = useState('FICTION');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  // Format instances state
  const [formats, setFormats] = useState({
    physical: { enabled: true, price: '', stock: 50 },
    digital: { enabled: false, price: '', filePath: '' },
    audio: { enabled: false, price: '', filePath: '' },
  });

  // Authors list from API
  const [authors, setAuthors] = useState([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);

  // Submission & validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Price change modal for Edit Mode
  const [priceModal, setPriceModal] = useState({
    isOpen: false,
    formatType: 'PHYSICAL',
    formatLabel: 'Physical Book',
    currentPrice: 0,
    newPrice: '',
    reason: '',
    submitting: false,
  });

  const isEditMode = bookToEdit !== null;

  // Load available authors
  useEffect(() => {
    let mounted = true;
    const fetchAuthors = async () => {
      try {
        setLoadingAuthors(true);
        const data = await PublisherService.getAuthors();
        if (mounted) {
          setAuthors(data || []);
          if (!isEditMode && data && data.length > 0) {
            setAuthorId(String(data[0].id));
          }
        }
      } catch (err) {
        console.error('Failed fetching authors:', err);
      } finally {
        if (mounted) setLoadingAuthors(false);
      }
    };
    fetchAuthors();
    return () => {
      mounted = false;
    };
  }, [isEditMode]);

  // Populate data in Edit Mode
  useEffect(() => {
    if (isEditMode && bookToEdit) {
      setTitle(bookToEdit.title || bookToEdit.name || '');
      setIsbn(bookToEdit.isbn || bookToEdit.raw?.isbn || '');
      setGenre(bookToEdit.genre || bookToEdit.raw?.genre || 'FICTION');
      setDescription(bookToEdit.description || bookToEdit.raw?.description || bookToEdit.aboutbook || '');
      setCoverImageUrl(bookToEdit.cover_image_url || bookToEdit.bookImage || '');

      // Identify matching author ID
      if (bookToEdit.author_id) {
        setAuthorId(String(bookToEdit.author_id));
      } else if (bookToEdit.raw?.author?.id) {
        setAuthorId(String(bookToEdit.raw.author.id));
      } else if (authors.length > 0) {
        const found = authors.find(
          (a) => a.name === bookToEdit.author || a.name === bookToEdit.author_name
        );
        if (found) setAuthorId(String(found.id));
      }

      // Populate format instances
      const rawFormats = bookToEdit.formats || bookToEdit.raw?.formats || [];
      const physicalFmt = rawFormats.find((f) => f.type === 'PHYSICAL');
      const digitalFmt = rawFormats.find((f) => f.type === 'DIGITAL');
      const audioFmt = rawFormats.find((f) => f.type === 'AUDIO');

      setFormats({
        physical: {
          enabled: !!physicalFmt || (!digitalFmt && !audioFmt),
          price: physicalFmt ? physicalFmt.price || '' : (bookToEdit.price || ''),
          stock: 50,
        },
        digital: {
          enabled: !!digitalFmt || bookToEdit.is_digital === true,
          price: digitalFmt ? digitalFmt.price || '' : '',
          filePath: bookToEdit.digital_file_path || '',
        },
        audio: {
          enabled: !!audioFmt || bookToEdit.is_audio === true,
          price: audioFmt ? audioFmt.price || '' : '',
          filePath: bookToEdit.audio_file_path || '',
        },
      });
    } else {
      // Reset form for New Book
      setTitle('');
      setIsbn('');
      setGenre('FICTION');
      setDescription('');
      setCoverImageUrl('');
      setFormats({
        physical: { enabled: true, price: '', stock: 50 },
        digital: { enabled: false, price: '', filePath: '' },
        audio: { enabled: false, price: '', filePath: '' },
      });
      if (authors.length > 0) {
        setAuthorId(String(authors[0].id));
      }
    }
  }, [isEditMode, bookToEdit, authors]);

  // Handle format toggle
  const handleToggleFormat = (formatKey) => {
    setFormats((prev) => ({
      ...prev,
      [formatKey]: {
        ...prev[formatKey],
        enabled: !prev[formatKey].enabled,
      },
    }));
  };

  // Handle format field change
  const handleFormatFieldChange = (formatKey, field, value) => {
    setFormats((prev) => ({
      ...prev,
      [formatKey]: {
        ...prev[formatKey],
        [field]: value,
      },
    }));
  };

  // Open price change modal
  const handleOpenPriceModal = (formatKey, label) => {
    const fmt = formats[formatKey];
    setPriceModal({
      isOpen: true,
      formatType: formatKey.toUpperCase(),
      formatLabel: label,
      currentPrice: fmt?.price || bookToEdit?.price || 0,
      newPrice: '',
      reason: '',
      submitting: false,
    });
  };

  const handleClosePriceModal = () => {
    setPriceModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Submit price change proposal for a specific format instance
  const handleSubmitPriceProposal = async (e) => {
    e.preventDefault();
    if (!currentPublisher?.id) {
      notificationRef.current?.showNotif('Please select an active publisher house first.', 'warning');
      return;
    }

    const priceVal = parseInt(priceModal.newPrice, 10);
    if (isNaN(priceVal) || priceVal <= 0) {
      notificationRef.current?.showNotif('Please enter a valid price in IRR.', 'warning');
      return;
    }

    try {
      setPriceModal((prev) => ({ ...prev, submitting: true }));
      await PublisherService.changePriceProposal({
        publisher_id: currentPublisher.id,
        book: bookToEdit.id,
        value: priceVal,
        reason: priceModal.reason || `Price update proposal for ${priceModal.formatLabel}`,
      });

      notificationRef.current?.showNotif(
        `Price change proposal for ${priceModal.formatLabel} submitted to administrators!`,
        'success'
      );
      handleClosePriceModal();
      if (onProposalCreated) onProposalCreated();
    } catch (err) {
      console.error('Failed submitting price proposal:', err);
      const errMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to submit price proposal.';
      notificationRef.current?.showNotif(errMsg, 'error');
    } finally {
      setPriceModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Submit Book Proposal (Creation or Update)
  const handleSubmitBookForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!currentPublisher?.id) {
      setFormError('No active publisher selected. Please choose a publisher house.');
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      setFormError('Book title must be at least 3 characters.');
      return;
    }

    if (!authorId) {
      setFormError('Please assign an author to this title.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setFormError('Description / synopsis must be at least 10 characters.');
      return;
    }

    const hasAtLeastOneFormat =
      formats.physical.enabled || formats.digital.enabled || formats.audio.enabled;
    if (!hasAtLeastOneFormat) {
      setFormError('Please enable at least one format (Physical, Digital, or Audio).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        // Book Update Proposal
        const updatePayload = {
          publisher_id: currentPublisher.id,
          book: bookToEdit.id,
          title: title.trim(),
          description: description.trim(),
          genre: genre,
          cover_image_url: coverImageUrl.trim() || null,
          is_digital: formats.digital.enabled,
          is_audio: formats.audio.enabled,
          digital_file_path: formats.digital.enabled ? formats.digital.filePath : '',
          audio_file_path: formats.audio.enabled ? formats.audio.filePath : '',
        };

        await PublisherService.updateBookProposal(updatePayload);
        notificationRef.current?.showNotif(
          'Book update proposal submitted successfully for administrator review!',
          'success'
        );
      } else {
        // Book Creation Proposal
        if (!isbn.trim()) {
          setFormError('Please enter an ISBN for new book proposals.');
          setIsSubmitting(false);
          return;
        }

        const createPayload = {
          publisher_id: currentPublisher.id,
          author: parseInt(authorId, 10),
          title: title.trim(),
          isbn: isbn.trim(),
          description: description.trim(),
          genre: genre,
          cover_image_url: coverImageUrl.trim() || null,
          is_digital: formats.digital.enabled,
          is_audio: formats.audio.enabled,
          digital_file_path: formats.digital.enabled ? formats.digital.filePath : '',
          audio_file_path: formats.audio.enabled ? formats.audio.filePath : '',
        };

        await PublisherService.createBookProposal(createPayload);
        notificationRef.current?.showNotif(
          'Book creation proposal submitted successfully for administrator review!',
          'success'
        );
      }

      if (onProposalCreated) onProposalCreated();
      if (clearEditMode) clearEditMode();
      if (PageChanger) PageChanger('mybook');
    } catch (err) {
      console.error('Failed submitting book proposal:', err);
      const resData = err.response?.data;
      let msg = 'Failed to submit proposal.';
      if (typeof resData === 'string') {
        msg = resData;
      } else if (resData?.detail) {
        msg = resData.detail;
      } else if (resData && typeof resData === 'object') {
        const firstKey = Object.keys(resData)[0];
        msg = `${firstKey}: ${Array.isArray(resData[firstKey]) ? resData[firstKey][0] : resData[firstKey]}`;
      }
      setFormError(msg);
      notificationRef.current?.showNotif(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-editor-wrapper">
      {/* Editor Header */}
      <div className="upload-editor-header">
        <div className="upload-editor-title-group">
          <h2>
            {isEditMode ? `${t('publisher_panel.editBookFormats', 'Edit Book Proposal')}: ${bookToEdit.name || bookToEdit.title}` : t('publisher_panel.proposeNewBook', 'Propose New Book')}
            <span className={`upload-mode-badge ${isEditMode ? 'edit' : 'create'}`}>
              {isEditMode ? t('publisher_panel.updateMode', 'Update Mode') : t('publisher_panel.newCreation', 'New Creation')}
            </span>
          </h2>
          <p>
            {isEditMode
              ? t('publisher_panel.editSubtitle', 'Modify book details or propose format price changes. All submissions require administrator approval.')
              : t('publisher_panel.createSubtitle', 'Submit a new book creation proposal to store administrators with multi-format pricing and media.')}
          </p>
        </div>

        {isEditMode && (
          <button
            type="button"
            className="editor-cancel-btn"
            onClick={() => {
              if (clearEditMode) clearEditMode();
              if (PageChanger) PageChanger('mybook');
            }}
          >
            ← {t('publisher_panel.backToPublished', 'Back to Published Books')}
          </button>
        )}
      </div>

      {formError && (
        <div className="upload-errors-container" style={{ borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', padding: '10px 16px' }}>
          <p style={{ color: '#f87171', margin: 0, fontWeight: 600 }}>⚠️ {formError}</p>
        </div>
      )}

      {/* Main Two-Column Grid Form */}
      <form onSubmit={handleSubmitBookForm} className="upload-editor-grid">
        {/* Left Column: Cover Art & Preview */}
        <div className="upload-cover-panel">
          <div className="upload-cover-box">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Book cover preview"
                onError={(e) => {
                  e.currentTarget.src = ppic14;
                }}
              />
            ) : (
              <div className="upload-cover-placeholder">
                <span style={{ fontSize: '2.5rem' }}>📖</span>
                <span>{t('publisher_panel.previewPlaceholder', 'Enter cover URL below to preview cover art')}</span>
              </div>
            )}
          </div>

          <div className="upload-cover-input-group">
            <label htmlFor="cover-url-input">{t('publisher_panel.coverUrl', 'Cover Image URL')}</label>
            <input
              id="cover-url-input"
              type="url"
              className="editor-input"
              placeholder="https://example.com/cover.jpg"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Core Metadata & Formats */}
        <div className="upload-fields-panel">
          {/* Row 1: Title & ISBN */}
          <div className="form-row-2col">
            <div className="form-field-group">
              <label htmlFor="book-title-input">
                {t('publisher_panel.bookTitle', 'Book Title')} <span className="required">*</span>
              </label>
              <input
                id="book-title-input"
                type="text"
                className="editor-input"
                placeholder="e.g. Master and Margarita"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="book-isbn-input">
                {t('publisher_panel.isbnCode', 'ISBN Code')} {!isEditMode && <span className="required">*</span>}
              </label>
              <input
                id="book-isbn-input"
                type="text"
                className="editor-input"
                placeholder="e.g. 978-0143108245"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                disabled={isEditMode}
                title={isEditMode ? 'ISBN cannot be altered after proposal approval' : 'Standard 13-digit ISBN'}
                required={!isEditMode}
              />
            </div>
          </div>

          {/* Row 2: Author & Genre */}
          <div className="form-row-2col">
            <div className="form-field-group">
              <label htmlFor="book-author-select">
                {t('common.author', 'Author')} <span className="required">*</span>
              </label>
              <select
                id="book-author-select"
                className="editor-select"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                disabled={loadingAuthors || isEditMode}
                required
              >
                {loadingAuthors ? (
                  <option value="">{t('common.loading', 'Loading authors...')}</option>
                ) : (
                  authors.map((auth) => (
                    <option key={auth.id} value={auth.id}>
                      {auth.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-field-group">
              <label htmlFor="book-genre-select">{t('publisher_panel.genreCategory', 'Genre Category')}</label>
              <select
                id="book-genre-select"
                className="editor-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-field-group">
            <label htmlFor="book-desc-textarea">
              {t('publisher_panel.descSynopsis', 'Description & Synopsis')} <span className="required">*</span>
            </label>
            <textarea
              id="book-desc-textarea"
              className="editor-textarea"
              placeholder={t('publisher_panel.descPlaceholder', 'Provide a compelling synopsis of the book...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* --------------------------------------------
              Multi-Format Instances & Separate Pricing
             -------------------------------------------- */}
          <div className="formats-section-container">
            <h3 className="formats-section-title">
              <span>📚 {t('publisher_panel.offeredEditionsPricing', 'Offered Editions & Format Pricing')}</span>
            </h3>

            <div className="format-instances-grid">
              {/* Format 1: Physical Print */}
              <div className={`format-instance-card ${formats.physical.enabled ? 'enabled' : ''}`}>
                <div className="format-card-header">
                  <span className="format-type-label">📦 {t('book.physicalBook', 'Physical Edition')}</span>
                  <label className="format-toggle-label">
                    <input
                      type="checkbox"
                      checked={formats.physical.enabled}
                      onChange={() => handleToggleFormat('physical')}
                    />
                    <span>{t('publisher_panel.available', 'Available')}</span>
                  </label>
                </div>

                {formats.physical.enabled && (
                  <div className="format-card-body">
                    <div className="form-field-group">
                      <label>{t('publisher_panel.retailPrice', 'Retail Price')}</label>
                      <div className="price-input-wrapper">
                        <input
                          type="number"
                          className="editor-input"
                          placeholder="e.g. 350000"
                          value={formats.physical.price}
                          onChange={(e) => handleFormatFieldChange('physical', 'price', e.target.value)}
                          disabled={isEditMode}
                        />
                        <span className="currency-tag">IRR</span>
                      </div>
                    </div>

                    {isEditMode && (
                      <div className="price-change-action-bar">
                        <span className="current-price-badge">
                          {t('publisher_panel.currentPrice', 'Current')}: <strong>{formatPrice(formats.physical.price)}</strong>
                        </span>
                        <button
                          type="button"
                          className="modify-price-btn"
                          onClick={() => handleOpenPriceModal('physical', 'Physical Edition')}
                        >
                          {t('publisher_panel.modifyPrice', 'Modify Price')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Format 2: Digital E-Book */}
              <div className={`format-instance-card ${formats.digital.enabled ? 'enabled' : ''}`}>
                <div className="format-card-header">
                  <span className="format-type-label">📄 {t('book.digitalPdf', 'Digital (E-Book/PDF)')}</span>
                  <label className="format-toggle-label">
                    <input
                      type="checkbox"
                      checked={formats.digital.enabled}
                      onChange={() => handleToggleFormat('digital')}
                    />
                    <span>{t('publisher_panel.available', 'Available')}</span>
                  </label>
                </div>

                {formats.digital.enabled && (
                  <div className="format-card-body">
                    <div className="form-field-group">
                      <label>{t('publisher_panel.ebookPrice', 'E-Book Price')}</label>
                      <div className="price-input-wrapper">
                        <input
                          type="number"
                          className="editor-input"
                          placeholder="e.g. 150000"
                          value={formats.digital.price}
                          onChange={(e) => handleFormatFieldChange('digital', 'price', e.target.value)}
                          disabled={isEditMode}
                        />
                        <span className="currency-tag">IRR</span>
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label>{t('publisher_panel.digitalFilePath', 'Digital File Path / URL')}</label>
                      <input
                        type="text"
                        className="editor-input"
                        placeholder="e.g. /files/ebook.pdf"
                        value={formats.digital.filePath}
                        onChange={(e) => handleFormatFieldChange('digital', 'filePath', e.target.value)}
                      />
                    </div>

                    {isEditMode && (
                      <div className="price-change-action-bar">
                        <span className="current-price-badge">
                          {t('publisher_panel.currentPrice', 'Current')}: <strong>{formatPrice(formats.digital.price || 0)}</strong>
                        </span>
                        <button
                          type="button"
                          className="modify-price-btn"
                          onClick={() => handleOpenPriceModal('digital', 'Digital E-Book')}
                        >
                          {t('publisher_panel.modifyPrice', 'Modify Price')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Format 3: Audiobook */}
              <div className={`format-instance-card ${formats.audio.enabled ? 'enabled' : ''}`}>
                <div className="format-card-header">
                  <span className="format-type-label">🎧 {t('book.audiobook', 'Audiobook')}</span>
                  <label className="format-toggle-label">
                    <input
                      type="checkbox"
                      checked={formats.audio.enabled}
                      onChange={() => handleToggleFormat('audio')}
                    />
                    <span>{t('publisher_panel.available', 'Available')}</span>
                  </label>
                </div>

                {formats.audio.enabled && (
                  <div className="format-card-body">
                    <div className="form-field-group">
                      <label>{t('publisher_panel.audiobookPrice', 'Audiobook Price')}</label>
                      <div className="price-input-wrapper">
                        <input
                          type="number"
                          className="editor-input"
                          placeholder="e.g. 220000"
                          value={formats.audio.price}
                          onChange={(e) => handleFormatFieldChange('audio', 'price', e.target.value)}
                          disabled={isEditMode}
                        />
                        <span className="currency-tag">IRR</span>
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label>{t('publisher_panel.audioStreamUrl', 'Audio Stream / File URL')}</label>
                      <input
                        type="text"
                        className="editor-input"
                        placeholder="e.g. /files/audiobook.mp3"
                        value={formats.audio.filePath}
                        onChange={(e) => handleFormatFieldChange('audio', 'filePath', e.target.value)}
                      />
                    </div>

                    {isEditMode && (
                      <div className="price-change-action-bar">
                        <span className="current-price-badge">
                          {t('publisher_panel.currentPrice', 'Current')}: <strong>{formatPrice(formats.audio.price || 0)}</strong>
                        </span>
                        <button
                          type="button"
                          className="modify-price-btn"
                          onClick={() => handleOpenPriceModal('audio', 'Audiobook')}
                        >
                          {t('publisher_panel.modifyPrice', 'Modify Price')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="upload-form-actions">
            {isEditMode && (
              <button
                type="button"
                className="editor-cancel-btn"
                onClick={() => {
                  if (clearEditMode) clearEditMode();
                  if (PageChanger) PageChanger('mybook');
                }}
              >
                {t('common.cancel', 'Cancel')}
              </button>
            )}
            <button
              type="submit"
              className="editor-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('publisher_panel.submittingProposal', 'Submitting Proposal...')
                : isEditMode
                ? t('publisher_panel.submitBookUpdate', 'Submit Book Update Proposal')
                : t('publisher_panel.submitBookProposal', 'Submit Book Proposal')}
            </button>
          </div>
        </div>
      </form>

      {/* Dedicated Price Change Proposal Modal */}
      {priceModal.isOpen && (
        <div className="price-modal-backdrop" onClick={handleClosePriceModal}>
          <div className="price-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="price-modal-header">
              <h3>💰 {t('publisher_panel.proposePriceChange', 'Propose Price Change')} ({priceModal.formatLabel})</h3>
              <button
                type="button"
                className="pdash-btn"
                onClick={handleClosePriceModal}
                style={{ padding: '4px 10px', minWidth: 'auto' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primarys)', opacity: 0.8 }}>
              {t('publisher_panel.currentPrice', 'Current Price')}: <strong>{formatPrice(priceModal.currentPrice)}</strong>
            </p>

            <form onSubmit={handleSubmitPriceProposal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-field-group">
                <label htmlFor="new-price-input">
                  {t('publisher_panel.proposedNewPrice', 'Proposed New Price (IRR)')} <span className="required">*</span>
                </label>
                <div className="price-input-wrapper">
                  <input
                    id="new-price-input"
                    type="number"
                    className="editor-input"
                    placeholder="e.g. 450000"
                    value={priceModal.newPrice}
                    onChange={(e) => setPriceModal((prev) => ({ ...prev, newPrice: e.target.value }))}
                    autoFocus
                    required
                  />
                  <span className="currency-tag">IRR</span>
                </div>
              </div>

              <div className="form-field-group">
                <label htmlFor="price-reason-textarea">{t('publisher_panel.justificationReason', 'Justification / Reason')}</label>
                <textarea
                  id="price-reason-textarea"
                  className="editor-textarea"
                  style={{ minHeight: 70 }}
                  placeholder={t('publisher_panel.reasonPlaceholder', 'e.g. Seasonal promotion, production cost change, or VIP discount alignment...')}
                  value={priceModal.reason}
                  onChange={(e) => setPriceModal((prev) => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div className="price-modal-actions">
                <button
                  type="button"
                  className="editor-cancel-btn"
                  onClick={handleClosePriceModal}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="editor-submit-btn"
                  disabled={priceModal.submitting}
                >
                  {priceModal.submitting ? t('common.loading', 'Submitting...') : t('publisher_panel.submitPriceProposal', 'Submit Price Proposal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Notification ref={notificationRef} />
    </div>
  );
}
