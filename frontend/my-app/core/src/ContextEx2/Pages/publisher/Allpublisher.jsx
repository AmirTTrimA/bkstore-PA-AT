import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../Components/Navbar'
import SimpleNav from '../../Components/SimpleNav'
import Footer from '../../Components/Footer'
import { useLanguage } from '../../Context/LanguageContext'
import PublisherService from '../../Services/PublisherService'
import "../../Styles/components/AllPublisher.css"
import {
  pub1, pub10, pub2,
  pub3, pub4, pub5,
  pub6, pub7, pub8,
  pub9
} from '../../Constants'

// Slug to imported asset mapping
export const PUBLISHER_LOGOS = {
  ofogh: pub1,
  porteghal: pub2,
  avanameh: pub3,
  'nasle-no': pub4,
  'nasle-noandish': pub4,
  negah: pub5,
  cheshmeh: pub6,
  'mah-ava': pub7,
  'khili-sabz': pub8,
  noon: pub9,
  rozane: pub10,
  rozaneh: pub10,
};

export function getPublisherLogo(slug) {
  if (!slug) return pub1;
  const normalized = String(slug).toLowerCase().trim();
  return PUBLISHER_LOGOS[normalized] || pub1;
}

// Backward compatibility export if any external reference remains
export const allPublishers = [];

// ============================================
//    Main 
// ============================================
export default function AllPublisher() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadPublishers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await PublisherService.getPublicPublishers();
        if (isMounted) {
          setPublishers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load publishers:", err);
        if (isMounted) {
          setError(t("publisher.loadError", "Failed to load publishers. Please try again later."));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPublishers();
    return () => {
      isMounted = false;
    };
  }, [t]);

  return (
    <div className="all-publisher-page-wrapper">
      {/* Mobile Navigation */}
      <div className="all-publisher-res">
        <SimpleNav />
      </div>

      {/* Desktop Navigation */}
      <div className="all-publisher-full">
        <Navbar />
      </div>

      <div className="all-publisher-container">
        {/* Top bar with Back button & Breadcrumbs */}
        <div className="all-publisher-top-bar">
          <button
            onClick={() => navigate(-1)}
            className="all-publisher-back-btn"
            type="button"
            title={t("common.back", "Go Back")}
          >
            ← {t("common.back", "Back")}
          </button>
          <div className="all-publisher-breadcrumbs">
            <Link to="/home">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="current">{t("publisher.publishers", "Publishers")}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-all-publisher-container">
          {/* Header */}
          <div className="publishers-title-container">
            <h1 className="publishers-title">{t("publisher.authorizedHouses", "Authorized Publishing Houses")}</h1>
            <p className="publishers-title-info">
              {t("publisher.housesDesc", "Explore trusted Iranian publishers and cultural organizations partnering with Bookkadeh. Discover thousands of authentic physical editions, ebooks, and audiobooks directly from primary sources.")}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="publishers-loading-state">
              <div className="publisher-spinner"></div>
              <p>{t("common.loading", "Loading publishing houses...")}</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="publishers-error-state">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="publisher-retry-btn"
                type="button"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}

          {/* Publisher Grid */}
          {!loading && !error && (
            <div className="all-publisher-cards-row">
              {publishers.map((item) => {
                const logo = getPublisherLogo(item.slug);
                return (
                  <Link
                    key={item.id}
                    to={`/publisher/${item.id}`}
                    className="publishers-cards"
                  >
                    <div className="publishers-card-pic">
                      <img
                        src={logo}
                        alt={item.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="publishers-card-info">
                      <h3 className="publishers-field-name">{item.name}</h3>
                      <div className="publishers-meta-badges">
                        <span className="pub-badge pub-books-badge">
                          <i className="fas fa-book"></i> {t("publisher.booksCount", "{count} Books", { count: item.books_count || 0 })}
                        </span>
                        {item.authors_count > 0 && (
                          <span className="pub-badge pub-authors-badge">
                            <i className="fas fa-user-edit"></i> {t("publisher.authorsCount", "{count} Authors", { count: item.authors_count })}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="publishers-card-desc">
                          {item.description.length > 95
                            ? item.description.slice(0, 95) + "..."
                            : item.description}
                        </p>
                      )}
                      <span className="publishers-view-action">
                        {t("publisher.viewCatalog", "View Catalog")} <i className="fas fa-angle-right"></i>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}

