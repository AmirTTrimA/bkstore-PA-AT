import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../Context/LanguageContext';
import { formatPrice } from '../../utils/formatPrice';

export default function NotifModal({ open, onClose, notifmessage = [], onWithdraw }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('ALL');
  const [confirmWithdrawId, setConfirmWithdrawId] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Group counts
  const counts = useMemo(() => {
    return {
      ALL: notifmessage.length,
      PENDING: notifmessage.filter((p) => p.status === 'PENDING').length,
      APPROVED: notifmessage.filter((p) => p.status === 'APPROVED' || p.status === 'APPLIED').length,
      REJECTED: notifmessage.filter((p) => p.status === 'REJECTED').length,
    };
  }, [notifmessage]);

  const filteredProposals = useMemo(() => {
    if (filter === 'ALL') return notifmessage;
    if (filter === 'APPROVED') {
      return notifmessage.filter((p) => p.status === 'APPROVED' || p.status === 'APPLIED');
    }
    return notifmessage.filter((p) => p.status === filter);
  }, [notifmessage, filter]);

  const getProposalTypeInfo = (type) => {
    switch (type) {
      case 'BOOK_CREATE':
        return { label: `📖 ${t('publisher_panel.newBook', 'New Book')}`, className: 'book_create' };
      case 'BOOK_UPDATE':
        return { label: `✏️ ${t('publisher_panel.bookUpdate', 'Book Update')}`, className: 'book_update' };
      case 'PRICE_CHANGE':
        return { label: `💰 ${t('publisher_panel.priceChange', 'Price Change')}`, className: 'price_change' };
      case 'AUTHOR_CREATE':
        return { label: `👤 ${t('publisher_panel.newAuthor', 'New Author')}`, className: 'author_create' };
      case 'AUTHOR_UPDATE':
        return { label: `📝 ${t('publisher_panel.authorUpdate', 'Author Update')}`, className: 'author_update' };
      default:
        return { label: `📋 ${t('publisher_panel.proposal', 'Proposal')}`, className: 'generic' };
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

  const handleWithdrawConfirm = async (proposalId) => {
    if (!onWithdraw) return;
    setIsWithdrawing(true);
    try {
      await onWithdraw(proposalId);
      setConfirmWithdrawId(null);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="price-modal-backdrop"
      onClick={onClose}
      style={{ zIndex: 1050 }}
    >
      <div
        className="price-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 28px',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primarys)' }}>
              🔔 {t('publisher_panel.proposalsActivityHub', 'Proposals & Activity Hub')}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-primarys)', opacity: 0.75 }}>
              {t('publisher_panel.proposalsHubDesc', 'Track submissions, editorial reviews, and status changes across all catalog items.')}
            </p>
          </div>

          <button
            type="button"
            className="pdash-btn"
            onClick={onClose}
            style={{ padding: '6px 12px' }}
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs Strip */}
        <div
          className="proposals-filter-strip"
          style={{ marginTop: '16px', marginBottom: '16px' }}
        >
          <button
            type="button"
            className={`proposal-filter-chip ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            {t('common.all', 'All')} ({counts.ALL})
          </button>
          <button
            type="button"
            className={`proposal-filter-chip ${filter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            {t('publisher_panel.pending', 'Pending')} ({counts.PENDING})
          </button>
          <button
            type="button"
            className={`proposal-filter-chip ${filter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setFilter('APPROVED')}
          >
            {t('publisher_panel.approved', 'Approved')} ({counts.APPROVED})
          </button>
          <button
            type="button"
            className={`proposal-filter-chip ${filter === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setFilter('REJECTED')}
          >
            {t('publisher_panel.rejected', 'Rejected')} ({counts.REJECTED})
          </button>
        </div>

        {/* Proposals List Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
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

                  {/* Admin Review Notes (if available) */}
                  {item.review_notes && (
                    <div
                      className={`admin-review-box ${
                        item.status === 'REJECTED' ? 'rejected-box' : ''
                      }`}
                    >
                      <strong>{t('publisher_panel.editorialFeedback', 'Editorial Feedback')}:</strong> {item.review_notes}
                    </div>
                  )}

                  {/* Withdraw action for Pending proposals */}
                  {isPending && (
                    <div className="proposal-card-actions">
                      {confirmWithdrawId === item.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.8rem', color: '#f87171' }}>
                            {t('publisher_panel.confirmWithdrawal', 'Withdraw this proposal?')}
                          </span>
                          <button
                            type="button"
                            className="withdraw-btn"
                            style={{ background: '#ef4444', color: '#fff' }}
                            onClick={() => handleWithdrawConfirm(item.id)}
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
                          title={t('publisher_panel.withdrawTitle', 'Withdraw proposal from admin queue')}
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
    </div>
  );
}
