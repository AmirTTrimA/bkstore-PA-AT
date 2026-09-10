// ✅
import React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Notification from './feature/Notification';

import {
  Box,
  Typography,
  Avatar,
  Button,
  MenuItem, 
  Menu,
  Divider,
  ListItemIcon,
} from '@mui/material'

import {
  Person,
  Help,
  Logout,
} from '@mui/icons-material';

// ---Components---
import { useAuth } from '../Context/AuthContext';
import { useLanguage } from '../Context/LanguageContext';
import { ThemeToggle } from './common/ThemeToggle';
import { LanguageToggle } from './common/LanguageToggle';
import { ppic13 } from "../Constants"

import '../Styles/components/Navbar.css'

// ---Constants---
const MAX_RECENT_SEARCHES = 10;
const SEARCH_MIN_LENGTH = 2;

export default function Navbar() {

    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, user, logout } = useAuth();
    const { t } = useLanguage();
    const inputRef = useRef(null);
    const searchDropdownRef = useRef(null);
    const notificationRef = useRef();

    // ---States---
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);

    // ---Memorized Values--- 
    const username = user?.username || "";
    const dashboardopen = Boolean(anchorEl);

    // Focus input and listen for outside clicks / escape when search opens
    useEffect(() => {
      if (!isSearchOpen) return;

      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 80);
      }

      const handleClickOutside = (e) => {
        if (
          searchDropdownRef.current &&
          !searchDropdownRef.current.contains(e.target) &&
          !e.target.closest('.search_bar_btn')
        ) {
          setIsSearchOpen(false);
        }
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsSearchOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isSearchOpen]);

    // ---Handlers---

    const saveRecentSearch = (searchTerm)=>{
      if(!searchTerm || searchTerm.length < SEARCH_MIN_LENGTH) return ;

      setRecentSearches(prev=>{
        const filtered = prev.filter(item=> item !== searchTerm);
        const updated = [searchTerm, ...filtered].slice(0,MAX_RECENT_SEARCHES);
        localStorage.setItem('recentSearches',JSON.stringify(updated));
        return updated;
      })
    }

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchInputValue.trim();
    if (trimmed.length >= SEARCH_MIN_LENGTH) {
      saveRecentSearch(trimmed);
      setIsSearchOpen(false);
      navigate(`/search/${encodeURIComponent(trimmed)}`);
    } else if (trimmed.length === 0) {
      setIsSearchOpen(false);
      navigate('/search');
    }
  };

  const handleRecentSearchClick = (term) => {
    setSearchInputValue(term);
    saveRecentSearch(term);
    setIsSearchOpen(false);
    navigate(`/search/${encodeURIComponent(term)}`);
  };

  const removeRecentSearch = (termToRemove, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter((term) => term !== termToRemove);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Dashboard Menu Handler
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClickout = () => {
    setAnchorEl(null);
  };

  const handleLoginCheck = useCallback((e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      if (notificationRef.current) {
        notificationRef.current.showNotif('Login required', 'error', {
          linkText: "login",
          linkHref: "/login"
        });
      }
      return false;
    }
    return true;
  }, [isLoggedIn]);

  return (
    <>
      {/* Unified Primary Navigation Bar */}
      <header className='bookkadeh-navbar pagenet-navbar'>
        <div className="navbar-container">
          {/* Left: Brand & Navigation Links */}
          <div className="navbar-left">
            <Link to="/home" className='nav-brand-logo'>
              <span className="brand-dot">●</span> {t('nav.brandName', 'Bookkadeh')}
            </Link>

            <nav className="nav-links-menu">
              <Link 
                to='/library' 
                className={`nav-link-item ${location.pathname === '/library' ? 'active' : ''}`}
              >
                {t('nav.catalog', 'Catalog')}
              </Link>
              <Link 
                to='/favorites' 
                onClick={handleLoginCheck} 
                className={`nav-link-item ${location.pathname === '/favorites' ? 'active' : ''}`}
              >
                {t('nav.wishlist', 'Wishlist')}
              </Link>
              <Link 
                to='/all-publisher' 
                className={`nav-link-item ${location.pathname.startsWith('/all-publisher') || location.pathname.startsWith('/publisher') ? 'active' : ''}`}
              >
                {t('nav.publishers', 'Publishers')}
              </Link>
              <Link 
                to='/faq' 
                className={`nav-link-item ${location.pathname === '/faq' ? 'active' : ''}`}
              >
                {t('nav.aboutUs', 'About Us')}
              </Link>
            </nav>
          </div>

          {/* Right: Controls & User Actions */}
          <div className="navbar-right">
            {/* Search Trigger */}
            <button
              type="button"
              className={`nav-icon-btn search_bar_btn ${isSearchOpen ? 'active' : ''}`}
              onClick={() => setIsSearchOpen((prev) => !prev)}
              title={t('common.search', 'Search books...')}
              aria-label="Toggle Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"></path>
              </svg>
            </button>

            {/* Theme Toggle */}
            <div className="nav-control-wrapper">
              <ThemeToggle page="home" />
            </div>

            {/* Language Toggle */}
            <div className="nav-control-wrapper">
              <LanguageToggle page="home" />
            </div>

            {/* Subscriptions */}
            <Link to="/subscription" className='nav-icon-btn' title={t('nav.subscription', 'Subscriptions')}>
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M160-240q-50 0-85-35t-35-85v-240q0-50 35-85t85-35h540q50 0 85 35t35 85v240q0 50-35 85t-85 35H160Zm0-80h540q17 0 28.5-11.5T740-360v-240q0-17-11.5-28.5T700-640H160q-17 0-28.5 11.5T120-600v240q0 17 11.5 28.5T160-320Zm700-60v-200h20q17 0 28.5 11.5T920-540v120q0 17-11.5 28.5T880-380h-20Zm-700 20v-240h540v240H160Z"/>
              </svg>
            </Link>

            {/* Shopping Cart */}
            <Link to="/basket" className='nav-icon-btn nav-cart-btn' title={t('nav.cart', 'Shopping Cart')}>
              <i className="fas fa-shopping-cart"></i>
            </Link>

            {/* User Auth Section */}
            {!isLoggedIn ? (
              <button 
                className='nav-auth-btn'
                onClick={() => navigate('/login')}
              >
                <span>{t('nav.login', 'Sign In')}</span>
                <span className="auth-sep">|</span>
                <span>{t('nav.signup', 'Sign Up')}</span>
              </button>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  onClick={handleClick}
                  sx={{ p: 0.5, minWidth: 'auto', borderRadius: '50%' }}
                >
                  <Avatar 
                    sx={{ width: 34, height: 34, border: '2px solid #d17842' }}
                    src={ppic13}
                  />
                </Button>
            
                <Menu
                  anchorEl={anchorEl}
                  open={dashboardopen}
                  onClose={handleClickout}
                  PaperProps={{
                    elevation: 3,
                    sx: { width: 250, maxWidth: '100%', mt: 1 }
                  }}
                >
                  <MenuItem onClick={() => { handleClickout(); navigate('/dashboard'); }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                      <Avatar 
                        sx={{ width: 36, height: 36, mr: 1.5 }}
                        src={ppic13}
                      />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{username}</Typography>
                        <Typography variant="caption" color="text.secondary">Reader Account</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
              
                  <Divider />
              
                  <MenuItem onClick={() => { handleClickout(); navigate('/dashboard'); }}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    {t('dashboard.profile', 'My Profile')}
                  </MenuItem>
              
                  <Divider />
            
                  <MenuItem onClick={() => { handleClickout(); navigate('/faq'); }}>
                    <ListItemIcon>
                      <Help fontSize="small" />
                    </ListItemIcon>
                    {t('nav.aboutUs', 'Help & FAQ')}
                  </MenuItem>

                  <Divider />

                  <MenuItem 
                    onClick={() => { handleClickout(); logout(); }}
                    sx={{ color: 'error.main' }}
                  >
                    <ListItemIcon>
                      <Logout fontSize="small" color="error" />
                    </ListItemIcon>
                    {t('nav.logout', 'Logout')}
                  </MenuItem>
                </Menu>
              </Box>   
            )}
          </div>
        </div>

        {/* Sleek Expandable Search Bar */}
        {isSearchOpen && (
          <div className="navbar-search-bar-dropdown" ref={searchDropdownRef}>
            <form className="nav-search-form" onSubmit={handleSearchSubmit}>
              <div className="nav-search-input-box">
                <i className="fas fa-search nav-search-icon"></i>
                <input
                  ref={inputRef}
                  type="search"
                  className="nav-search-input"
                  placeholder={t('nav.searchPlaceholder', 'Search books by title, author, genre, or ISBN...')}
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  autoComplete="off"
                />
                {searchInputValue && (
                  <button
                    type="button"
                    className="nav-search-clear"
                    onClick={() => setSearchInputValue('')}
                    title="Clear input"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
                <button
                  type="submit"
                  className="nav-search-submit-btn"
                  disabled={searchInputValue.trim().length > 0 && searchInputValue.trim().length < SEARCH_MIN_LENGTH}
                >
                  {t('common.search', 'Search')}
                </button>
                <button
                  type="button"
                  className="nav-search-close-btn"
                  onClick={() => setIsSearchOpen(false)}
                  title="Close search"
                >
                  ✕
                </button>
              </div>
            </form>

            {/* Recent Searches Panel */}
            {recentSearches.length > 0 && (
              <div className="nav-recent-searches-panel">
                <div className="nav-recent-searches-header">
                  <span className="nav-recent-title">
                    <i className="fas fa-history"></i> Recent Searches
                  </span>
                  <button
                    type="button"
                    className="nav-recent-clear-all"
                    onClick={clearAllRecentSearches}
                  >
                    {t('common.clear', 'Clear all')}
                  </button>
                </div>
                <div className="nav-recent-chips-list">
                  {recentSearches.map((term) => (
                    <span key={term} className="nav-recent-chip">
                      <span
                        className="nav-recent-chip-text"
                        onClick={() => handleRecentSearchClick(term)}
                      >
                        {term}
                      </span>
                      <button
                        type="button"
                        className="nav-recent-chip-remove"
                        onClick={(e) => removeRecentSearch(term, e)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      <Notification ref={notificationRef} />
    </>
  );
}
