import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import { useAuth } from '../../Context/AuthContext';
import { useCart } from '../../Hooks/queries';

import '../../Styles/components/BottomNav.css';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isLoggedIn } = useAuth();

  const { data: cartData } = useCart({ enabled: Boolean(isLoggedIn) });
  const cartCount = useMemo(() => {
    if (!cartData) return 0;
    const items = cartData.items || cartData.order_items || (Array.isArray(cartData) ? cartData : []);
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cartData]);

  const currentPath = location.pathname;

  const handleDashboardClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      navigate('/login');
    }
  };

  const handleFavoritesClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      navigate('/login');
    }
  };

  const isHomeActive = currentPath === '/' || currentPath === '/home';
  const isCatalogActive = currentPath.startsWith('/library') || currentPath.startsWith('/book') || currentPath.startsWith('/search');
  const isCartActive = currentPath.startsWith('/basket') || currentPath.startsWith('/checkout');
  const isFavoritesActive = currentPath.startsWith('/favorites');
  const isDashboardActive = currentPath.startsWith('/dashboard') || currentPath.startsWith('/pub-dashboard');

  return (
    <aside className="bk-bottom-nav-container" aria-label="Mobile Bottom Navigation">
      <nav className="bk-bottom-nav">
        {/* Home */}
        <Link
          to="/"
          className={`bk-nav-item ${isHomeActive ? 'active' : ''}`}
          aria-label={t('nav.home', 'Home')}
        >
          <div className="bk-nav-icon-wrap">
            <i className="fas fa-home"></i>
          </div>
          <span className="bk-nav-label">{t('nav.home', 'Home')}</span>
        </Link>

        {/* Catalog */}
        <Link
          to="/library"
          className={`bk-nav-item ${isCatalogActive ? 'active' : ''}`}
          aria-label={t('nav.explore', 'Catalog')}
        >
          <div className="bk-nav-icon-wrap">
            <i className="fas fa-book-open"></i>
          </div>
          <span className="bk-nav-label">{t('nav.explore', 'Catalog')}</span>
        </Link>

        {/* Cart */}
        <Link
          to="/basket"
          className={`bk-nav-item ${isCartActive ? 'active' : ''}`}
          aria-label={t('nav.cart', 'Cart')}
        >
          <div className="bk-nav-icon-wrap">
            <i className="fas fa-shopping-cart"></i>
            {cartCount > 0 && (
              <span className="bk-nav-badge">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span className="bk-nav-label">{t('nav.cart', 'Cart')}</span>
        </Link>

        {/* Favorites */}
        <Link
          to="/favorites"
          onClick={handleFavoritesClick}
          className={`bk-nav-item ${isFavoritesActive ? 'active' : ''}`}
          aria-label={t('library.favorites', 'Favorites')}
        >
          <div className="bk-nav-icon-wrap">
            <i className="fas fa-heart"></i>
          </div>
          <span className="bk-nav-label">{t('library.favorites', 'Favorites')}</span>
        </Link>

        {/* Dashboard */}
        <Link
          to="/dashboard"
          onClick={handleDashboardClick}
          className={`bk-nav-item ${isDashboardActive ? 'active' : ''}`}
          aria-label={t('dashboard.title', 'Dashboard')}
        >
          <div className="bk-nav-icon-wrap">
            <i className="fas fa-user"></i>
          </div>
          <span className="bk-nav-label">{t('dashboard.title', 'Dashboard')}</span>
        </Link>
      </nav>
    </aside>
  );
}
