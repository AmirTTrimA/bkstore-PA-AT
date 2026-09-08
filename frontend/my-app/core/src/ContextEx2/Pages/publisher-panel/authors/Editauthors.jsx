import React, { useState, useRef, useEffect, useCallback } from 'react';
import Notification from '../../../Components/feature/Notification';
import PublisherService from '../../../Services/PublisherService';

import '../../../Styles/publisher-panel/Editauthors.css';

const MIN_NAME_LENGTH = 3;
const MIN_BIO_LENGTH = 10;

export default function Editauthors({
  authorToEdit,
  onEditComplete,
  currentPublisher,
  onProposalCreated,
}) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const notificationRef = useRef();

  const isEditMode = authorToEdit !== null;

  useEffect(() => {
    if (isEditMode && authorToEdit) {
      setName(authorToEdit.name || '');
      setBio(authorToEdit.biography || authorToEdit.bio || '');
    } else {
      setName('');
      setBio('');
    }
  }, [isEditMode, authorToEdit]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError('');

      if (!currentPublisher?.id) {
        setFormError('Please select an active publisher house before submitting.');
        return;
      }

      if (name.trim().length < MIN_NAME_LENGTH) {
        setFormError(`Author name must be at least ${MIN_NAME_LENGTH} characters.`);
        return;
      }

      if (bio.trim().length < MIN_BIO_LENGTH) {
        setFormError(`Author biography must be at least ${MIN_BIO_LENGTH} characters.`);
        return;
      }

      setIsSubmitting(true);
      try {
        if (isEditMode) {
          await PublisherService.updateAuthorProposal({
            publisher_id: currentPublisher.id,
            author: authorToEdit.id,
            name: name.trim(),
            biography: bio.trim(),
          });
          notificationRef.current?.showNotif(
            'Author update proposal submitted successfully for administrator review!',
            'success'
          );
        } else {
          await PublisherService.createAuthorProposal({
            publisher_id: currentPublisher.id,
            name: name.trim(),
            biography: bio.trim(),
          });
          notificationRef.current?.showNotif(
            'Author creation proposal submitted successfully for administrator review!',
            'success'
          );
        }

        setTimeout(() => {
          if (onProposalCreated) onProposalCreated();
          if (onEditComplete) onEditComplete();
        }, 1200);
      } catch (err) {
        console.error('Failed to submit author proposal:', err);
        const resMsg =
          err.response?.data?.detail ||
          err.response?.data?.name?.[0] ||
          'Failed to submit author proposal. Please try again.';
        setFormError(resMsg);
        notificationRef.current?.showNotif(resMsg, 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentPublisher, name, bio, isEditMode, authorToEdit, onProposalCreated, onEditComplete]
  );

  return (
    <div className="edit-authors-panel">
      <div className="edit-authors-header">
        <h3>
          {isEditMode ? `Edit Author Proposal: ${authorToEdit.name}` : 'Propose New Author'}
        </h3>
        <p>
          Author profiles are catalog-wide entities. All author creations and edits require review by store administrators.
        </p>
      </div>

      {formError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ color: '#f87171', margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
            ⚠️ {formError}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="author-form-body">
        <div className="author-form-field">
          <label htmlFor="author-name-input">
            Author Full Name <span className="required">*</span>
          </label>
          <input
            id="author-name-input"
            type="text"
            className="editor-input"
            placeholder="e.g. Leo Tolstoy"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="author-form-field">
          <label htmlFor="author-bio-textarea">
            Biography & Summary <span className="required">*</span>
          </label>
          <textarea
            id="author-bio-textarea"
            className="editor-textarea"
            style={{ minHeight: 120 }}
            placeholder="Write a comprehensive biography of the author, notable awards, and background..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          />
          <span className="char-counter">{bio.length} characters (min {MIN_BIO_LENGTH})</span>
        </div>

        <div className="author-form-actions">
          <button
            type="button"
            className="editor-cancel-btn"
            onClick={onEditComplete}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="editor-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Submitting Proposal...'
              : isEditMode
              ? 'Submit Author Update'
              : 'Submit Author Proposal'}
          </button>
        </div>
      </form>

      <Notification ref={notificationRef} />
    </div>
  );
}
