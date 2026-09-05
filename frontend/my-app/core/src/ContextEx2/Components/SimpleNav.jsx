// ✅
import React from 'react'

import { useState,useRef,useEffect } from 'react';
import { useNavigate , Link } from 'react-router-dom';


import {
  Modal,
  Box,
  TextField,
  Typography,
  Chip,
  Button,

} from '@mui/material'



import {
  Search,
  History,
  Delete,

} from '@mui/icons-material';

import {search_results} from '../Pages/search/Search'
import "../Styles/components/SimpleNav.css"


// ============================================
//    Constants
// ============================================
const MAX_RECENT_SEARCHES = 10;
const SEARCH_MIN_LENGTH = 2;

export default function SimpleNav() {

  const navigate=useNavigate();
  const inputRef= useRef(null);



  // ---State---
  // eslint-disable-next-line no-unused-vars
  const [searchTerm,setSearchTerm]= useState([]);
  const [searchInputValue,setSearchInputValue] = useState('');
  const [recentSearches,setRecentSearches] = useState([]);
  const [open,setOpen] = useState(false);




  // ---Recent Searches---
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




  const saveRecentSearch = (searchTerm)=>{
    if(!searchTerm || searchTerm.length < SEARCH_MIN_LENGTH) return ;
    setRecentSearches(prev=>{
      const filtered = prev.filter(item=> item !== searchTerm);
      const updated = [searchTerm, ...filtered].slice(0,MAX_RECENT_SEARCHES);
      localStorage.setItem('recentSearches',JSON.stringify(updated));
      return updated;
    })
  }





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





    // ---Recent Search Actions---
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
  




// ---Modal Handlers--- 
    const handleOpen = () =>setOpen(true);
    const handleClose = () =>{
      setOpen(false);
      setSearchTerm([]);
      setSearchInputValue('');
    }




    // Auto-focus when modal opens
    useEffect(() => {
      if (open && inputRef.current) {
        setTimeout(() => {
          inputRef.current.focus();
        }, 100);
      }
    }, [open]);





  return (
    <>
    
    <div className="SimpleNav">
          <nav className='simple-navbar'>
            {/* Left Side Navigation */}
            <div className="left">
                <button onClick={()=>navigate(-1)} className="items" id='back' >
                    <i className="fas fa-angle-left"></i>
                </button>
                <button onClick={()=>navigate('/home')} className="items" id='back' >
                    <i className="fas fa-home"></i>
                </button>
            </div>
            {/* Right Side Navigation */}
            <div className="right">
                <Link to="/basket" className="items">
                      <svg className="cart-icon" viewBox="0 -966 960 960" width="40" height="30">
                        <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"/>
                      </svg>
                </Link>

                  <button className='items' id='silent-search' onClick={handleOpen}>
                    <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="40" height="30">
                      <path  d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                      </svg>
                  </button>
            </div>   
          </nav>
        </div>

  {/* Search Modal */}
  <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="login-modal-title"
        >
              <Box 
                className='mod-box mod-special mod-search '
              >
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
                                    inputRef={inputRef}
                                    value={searchInputValue}
                                   
                                    onChange={handleSearch}
                                    onKeyPress={handleKeyPress}
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

                                {/* Recent Searches */}
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
                                                    Category: {item.category} | Price: {formatPrice(item.price)}
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
