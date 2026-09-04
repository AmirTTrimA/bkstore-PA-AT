// ✅
import React from 'react'
import { useState,useRef,useEffect } from 'react';
import { useNavigate,useLocation , matchPath , Link } from 'react-router-dom';
import Notification from './feature/Notification';

import {
  Modal,
  Box,
  TextField,
  Typography,
  Avatar,
  Button,
  MenuItem, 
  Menu,
  Divider,
  ListItemIcon,
  Chip,

} from '@mui/material'


import {
  Person,
  Help,
  Logout,
  Search,
  History,
  Delete,
} from '@mui/icons-material';

// ---Components---
import { useAuth } from '../Context/AuthContext';
import { ThemeToggle } from './common/ThemeToggle';
import {search_results} from '../Pages/search/Search';
import {ppic13} from "../Constants"


import '../Styles/components/Navbar.css'
import { useCallback } from 'react';

// ---Constants---
const MAX_RECENT_SEARCHES = 10;
const SEARCH_MIN_LENGTH = 2;


export default function Navbar() {


    const navigate = useNavigate();
    const location = useLocation();
    const {isLoggedIn,user,logout,} = useAuth();
    const inputRef= useRef(null)
    const secondaryNavRef = useRef(null)
    const notificationRef = useRef();


    // ---States---
    const [open,setOpen] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [searchTerm,setSearchTerm]= useState([]);
    const [searchInputValue,setSearchInputValue] = useState('');
    const [recentSearches,setRecentSearches] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isSecondaryVisible,setIsSecondaryVisible] = useState(true)




    // ---Memorized Values--- 
    const username = user?.username  || "";
    const dashboardopen = Boolean(anchorEl);


    // ---Route Detection---
    const isLibraryPage = matchPath('/library',location.pathname);
    const isBookPage = matchPath('/book/:bookId',location.pathname);
    const isAllPublisherPage = matchPath('/all-publisher',location.pathname);
    const isSearchPage = matchPath('/search/:searchTerm',location.pathname);







  // ---Modal Handlers---
  const handleopen = () =>setOpen(true);
  const handleClose = () =>{
    setOpen(false);
    setSearchTerm([]);
    setSearchInputValue('');
  }
  





// ---Effects---

  // Recent Searches
  useEffect(()=>{
    const savedsearch = localStorage.getItem('recentSearches');
    if(savedsearch){
      try{
        setRecentSearches(JSON.parse(savedsearch));
      }catch (e){
          console.log('failed to load recent ' , e);
      }
    }

  },[])


  // Focus input when modal open
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [open]);


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




// Search Handlers
    const handleSearch = (e) => {
    const value = e.target.value?.toLowerCase().trim() || '';
    setSearchInputValue(value);
    if(value.length < SEARCH_MIN_LENGTH ){
      setSearchTerm([])
      return
    }
  

    const foundResult = search_results.filter(book=>{

    const idMatch = book.searchId === value;
    const categoryMatch = book.category.toLocaleLowerCase().includes(value);
    const nameMatch = book.name.toLocaleLowerCase().includes(value);

    return idMatch || categoryMatch || nameMatch;

    }) 

    
      setSearchTerm(foundResult);
  
    };

    const handleKeyPress = (e)=>{
      if(e.key === 'Enter' && searchInputValue.trim().length >= SEARCH_MIN_LENGTH){
        handleSearchNavigate(searchInputValue.trim())
      }
    };

    const handleSearchNavigate = (searchTerm) => {
      if(searchTerm && searchInputValue.length >= SEARCH_MIN_LENGTH){
        saveRecentSearch(searchTerm);
        handleClose();
        navigate(`/search/${encodeURIComponent(searchTerm)}`)

      }
    };





    const handleRecentSearchClick = (term) => {
      setSearchInputValue(term);
      handleSearchNavigate(term);
    };

    const removeRecentSearch = (termToRemove, e) => {
      e.stopPropagation();
      const updated = recentSearches.filter(term => term !== termToRemove);
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





    const handleLoginCheck = useCallback((e)=>{
      if(!isLoggedIn){
        e.preventDefault();
        if(notificationRef.current){
          notificationRef.current.showNotif(' require','error',{
            linkText:"login",
            linkHref:"/login"
          })
        }
        return false;
      }
      return true;
    },[isLoggedIn])






 



  return (
    <>
    {/* Primary Navigation */}
      <nav className='upper_nav'>
        <ul >
            <div className="first_middle_nav">
                  <li>
                    <Link to="/basket" id='shop_cart' className='fas fa-shopping-cart'/>
                  </li>

                  {!isLoggedIn ?(
                    <button 
                      className='login_check'
                      onClick={()=>navigate('/login')}
                    >
                      login|signup
                    </button>
                  ):(
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Button
                            onClick={handleClick}
                            sx={{ textTransform: 'none' , mt:1 }}
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
                       
                              <MenuItem >
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
                        
                              <MenuItem onClick={()=>navigate('/dashboard')}>
                                <ListItemIcon>
                                  <Person fontSize="small" />
                                </ListItemIcon>
                                My Profile
                              </MenuItem>
                        

                              <Divider />
                        
                      
                              <MenuItem onClick={()=>navigate('/faq')}>
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
              
                  <li><Link to="#" className='search_bar' onClick={handleopen}><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"></path><path  d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg></Link></li>
                  <li><Link to="/subscription" className='sub-battery'><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" ><path d="M160-240q-50 0-85-35t-35-85v-240q0-50 35-85t85-35h540q50 0 85 35t35 85v240q0 50-35 85t-85 35H160Zm0-80h540q17 0 28.5-11.5T740-360v-240q0-17-11.5-28.5T700-640H160q-17 0-28.5 11.5T120-600v240q0 17 11.5 28.5T160-320Zm700-60v-200h20q17 0 28.5 11.5T920-540v120q0 17-11.5 28.5T880-380h-20Zm-700 20v-240h540v240H160Z"/></svg></Link></li>
            </div>
            
        </ul>
      </nav>





      {/* Secondary Navigation */}
      <nav
        ref={secondaryNavRef}
        className={`secondary_nav ${isSecondaryVisible ? 'visible':'hidden'}`}
      >
          {(!isLibraryPage && !isBookPage && !isSearchPage && !isAllPublisherPage) && (
              <div className="secondary_nav_left">
                <ThemeToggle page='home'/>
              </div>
          )}
        <ul className='secondary_nav_right'>
          {!isLibraryPage && (
            <li ><Link to='/library' className='category'>library</Link></li>
          )}
          <li ><Link to='/favorites' onClick={handleLoginCheck}  className='favorites'>favorites</Link></li>
          <li ><Link to='/faq' className='anyquestion'>any question</Link></li>
        </ul>

      </nav>
      
      <Notification ref={notificationRef} />


 {/* Search Modal */}
 <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="login-modal-title"
        >
          <Box className='mod-box mod-special mod-search'>
                      <Typography 
                        variant="h4"
                        color='black'
                        style={{textAlign:'center',fontWeight:'700'}}
                      >
                         Search
                      </Typography>
                
                        <div style={{marginBottom:'20px'}}>
                               <Box sx={{ display: 'flex',alignContent:'center', gap: 1, mb: 3 , mt: 2 }}>
                                  <TextField
                                    fullWidth
                                    size="medium"
                                    placeholder="Search by name, category, or author..."
                                    name="search"
                                    type="search"
                                    inputref={inputRef}
                                    value={searchInputValue}
                                    
                                    onChange={handleSearch}
                                    onKeyDown={handleKeyPress}
                                    sx={{ flex: 1 , margin:'normal' }}
                                  />
                                  <Button 
                                    variant="contained" 
                                    onClick={() => handleSearchNavigate(searchInputValue.trim())}
                                    disabled={searchInputValue.trim().length < 2}
                                    sx={{ minWidth: 'auto', px: 2 }}
                                  >
                                    <Search />
                                  </Button>
                                </Box>

                              {/* Recent Search */}
                                {recentSearches.length > 0 && (
                                  <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <History fontSize="small" /> Recent Searches
                                      </Typography>
                                      <Button size="small" onClick={clearAllRecentSearches} color="error">
                                        <Delete/>
                                      </Button>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                      {recentSearches.map((term, index) => (
                                        <Chip
                                          key={index}
                                          label={term}
                                          onClick={() => handleRecentSearchClick(term)}
                                          onDelete={(e) => removeRecentSearch(term, e)}
                                          variant="outlined"
                                          sx={{ cursor: 'pointer' }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                )}

                           </div>



                        {/* NO Item Found in Search */}
                           
                           {/* <div style={{color:'black' , overflowY:'auto'}}>
                                  
                                  {searchTerm.length >0 ?(

                                       searchTerm.map(item=>(
                                           <div 
                                            key={item.searchId}
                                            onClick={()=>{
                                              handleClose();
                                              navigate(`/search/${item.searchId}`);
                                            }}
                                            >
                                               <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                                                    {item.name}
                                                  </Typography>
                                                  <Typography variant="body2" color="textSecondary">
                                                    Category: {item.category} | Price: {item.price}$
                                                  </Typography>
                  
                                           </div>
                                       ))

                                            // <div>
                                            //   found something
                                            // </div>


                                           ):(

                                              searchInputValue.length >= 2 && (
                                                              <Typography variant="body2" color="error" style={{ textAlign: 'center', padding: '20px' }}>
                                                                No results found for "{searchInputValue}"
                                                              </Typography>
                                                  )                                           
                                                  )} 

                              

                            </div> */}
                            

          </Box>
</Modal>

</>
  )
}
