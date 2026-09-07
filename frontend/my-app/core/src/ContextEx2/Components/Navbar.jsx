// ✅
import React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, matchPath, Link } from 'react-router-dom';
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
import { ThemeToggle } from './common/ThemeToggle';
import { ppic13 } from "../Constants"

import '../Styles/components/Navbar.css'

// ---Constants---
const MAX_RECENT_SEARCHES = 10;
const SEARCH_MIN_LENGTH = 2;

export default function Navbar() {

    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, user, logout } = useAuth();
    const inputRef = useRef(null);
    const searchDropdownRef = useRef(null);
    const secondaryNavRef = useRef(null);
    const notificationRef = useRef();

    // ---States---
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isSecondaryVisible, setIsSecondaryVisible] = useState(true);

    // ---Memorized Values--- 
    const username = user?.username || "";
    const dashboardopen = Boolean(anchorEl);

    // ---Route Detection---
    const isLibraryPage = matchPath('/library', location.pathname);
    const isBookPage = matchPath('/book/:bookId', location.pathname);
    const isAllPublisherPage = matchPath('/all-publisher', location.pathname);
    const isSearchPage = matchPath('/search/:searchTerm', location.pathname);

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


   // Scroll Handler for Secondary Nav 
   useEffect(() => {
    let lastY = window.scrollY;
  
    const handleScroll = () => {
      const currentY = window.scrollY;
    
      if (currentY < 100 || currentY < lastY) {
        setIsSecondaryVisible(true);
      } else {setIsSecondaryVisible(false);}
    
      lastY = currentY;
    };

     window.addEventListener('scroll', handleScroll, { passive: true });
     return () => window.removeEventListener('scroll', handleScroll);
  }, []);






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
        notificationRef.current.showNotif(' require', 'error', {
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
      {/* Primary Navigation */}
      <nav className='upper_nav'>
        <ul>
          <div className="first_middle_nav">
            <li>
              <Link to="/basket" id='shop_cart' className='fas fa-shopping-cart' />
            </li>

            {!isLoggedIn ? (
              <button 
                className='login_check'
                onClick={() => navigate('/login')}
              >
                login|signup
              </button>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  onClick={handleClick}
                  sx={{ textTransform: 'none', mt: 1 }}
                >
                  <Avatar 
                    sx={{ width: 24, height: 24 }}
                    src={ppic13}
                  />
                </Button>
            
                <Menu
                  anchorEl={anchorEl}
                  open={dashboardopen}
                  onClose={handleClickout}
                  PaperProps={{
                    elevation: 3,
                    sx: { width: 250, maxWidth: '100%' }
                  }}
                >
                  <MenuItem>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                      <Avatar 
                        sx={{ width: 40, height: 40, mr: 2 }}
                        src={ppic13}
                      />
                      <Box>
                        <Typography variant="subtitle1">{username}</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
              
                  <Divider />
              
                  <MenuItem onClick={() => navigate('/dashboard')}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    My Profile
                  </MenuItem>
              
                  <Divider />
            
                  <MenuItem onClick={() => navigate('/faq')}>
                    <ListItemIcon>
                      <Help fontSize="small" />
                    </ListItemIcon>
                    Question
                  </MenuItem>

                  <Divider />

                  <MenuItem 
                    onClick={logout}
                    sx={{ color: 'error.main' }}
                  >
                    <ListItemIcon>
                      <Logout fontSize="small" color="error" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </Box>   
            )}
          </div>

          <li><Link to="/home" className='nav-logo'>PageNet</Link></li>
          
          <div className="second_middle_nav">
            <li>
              <button
                type="button"
                className={`search_bar_btn ${isSearchOpen ? 'active' : ''}`}
                onClick={() => setIsSearchOpen((prev) => !prev)}
                title="Search books..."
                aria-label="Toggle Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                  <path d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z"></path>
                </svg>
              </button>
            </li>
            <li>
              <Link to="/subscription" className='sub-battery' title="Subscriptions">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
                  <path d="M160-240q-50 0-85-35t-35-85v-240q0-50 35-85t85-35h540q50 0 85 35t35 85v240q0 50-35 85t-85 35H160Zm0-80h540q17 0 28.5-11.5T740-360v-240q0-17-11.5-28.5T700-640H160q-17 0-28.5 11.5T120-600v240q0 17 11.5 28.5T160-320Zm700-60v-200h20q17 0 28.5 11.5T920-540v120q0 17-11.5 28.5T880-380h-20Zm-700 20v-240h540v240H160Z"/>
                </svg>
              </Link>
            </li>
          </div>
        </ul>

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
                  placeholder="Search books by title, author, genre, or ISBN..."
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
                  Search
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

            {recentSearches.length > 0 && (
              <div className="nav-recent-searches">
                <div className="nav-recent-header">
                  <span>
                    <i className="fas fa-history"></i> Recent Searches
                  </span>
                  <button
                    type="button"
                    className="nav-recent-clear-btn"
                    onClick={clearAllRecentSearches}
                  >
                    Clear All
                  </button>
                </div>
                <div className="nav-recent-chips">
                  {recentSearches.map((term, index) => (
                    <span key={index} className="nav-recent-chip">
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
      </nav>

      {/* Secondary Navigation */}
      <nav
        ref={secondaryNavRef}
        className={`secondary_nav ${isSecondaryVisible ? 'visible' : 'hidden'}`}
      >
        {(!isLibraryPage && !isBookPage && !isSearchPage && !isAllPublisherPage) && (
          <div className="secondary_nav_left">
            <ThemeToggle page='home'/>
          </div>
        )}
        <ul className='secondary_nav_right'>
          {!isLibraryPage && (
            <li><Link to='/library' className='category'>library</Link></li>
          )}
          <li><Link to='/favorites' onClick={handleLoginCheck} className='favorites'>favorites</Link></li>
          <li><Link to='/faq' className='anyquestion'>any question</Link></li>
        </ul>
      </nav>
      
      <Notification ref={notificationRef} />

</>
  )
}
