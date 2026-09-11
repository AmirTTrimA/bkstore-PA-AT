import React, { useState, useCallback } from 'react';
import { useLanguage } from '../../../Context/LanguageContext';
import Editauthors from './Editauthors';
import Allauthor from './Allauthor';

import '../../../Styles/publisher-panel/Authors.css';

export default function Authors({ currentPublisher, onProposalCreated }) {
  const { t } = useLanguage();
  // 0: Roster List, 1: Propose New / Edit
  const [tabIndex, setTabIndex] = useState(0);
  const [authorToEdit, setAuthorToEdit] = useState(null);

  const handleEditAuthor = useCallback((author) => {
    setAuthorToEdit(author);
    setTabIndex(1);
  }, []);

  const handleNewAuthor = useCallback(() => {
    setAuthorToEdit(null);
    setTabIndex(1);
  }, []);

  const handleComplete = useCallback(() => {
    setAuthorToEdit(null);
    setTabIndex(0);
  }, []);

  return (
    <div className="authors-wrapper">
      {/* Custom Glassmorphic Navigation Tabs */}
      <div className="authors-nav-tabs">
        <button
          type="button"
          className={`author-tab-btn ${tabIndex === 0 ? 'active' : ''}`}
          onClick={() => {
            setAuthorToEdit(null);
            setTabIndex(0);
          }}
        >
          {t('publisher_panel.authorsRoster', 'Authors Roster')}
        </button>

        <button
          type="button"
          className={`author-tab-btn ${tabIndex === 1 ? 'active' : ''}`}
          onClick={handleNewAuthor}
        >
          {authorToEdit ? `${t('common.edit', 'Edit')}: ${authorToEdit.name}` : t('publisher_panel.proposeNewAuthor', 'Propose New Author')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="authors-tab-content">
        {tabIndex === 0 && (
          <Allauthor
            onEditAuthor={handleEditAuthor}
            onAddNew={handleNewAuthor}
          />
        )}

        {tabIndex === 1 && (
          <Editauthors
            authorToEdit={authorToEdit}
            onEditComplete={handleComplete}
            currentPublisher={currentPublisher}
            onProposalCreated={onProposalCreated}
          />
        )}
      </div>
    </div>
  );
}
