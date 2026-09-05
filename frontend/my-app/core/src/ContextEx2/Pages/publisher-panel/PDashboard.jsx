// ✅
import React,{useState,useRef,useEffect,useMemo,useCallback } from 'react';
import Profile from '../dashboard/profile/Profile';
import Authors from './authors/Authors';
import Upload from './Upload';
import NotifModal from './NotifModal';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import IconButton from '@mui/material/IconButton';
import Notification from '../../Components/feature/Notification';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

import { ppic14 } from '../../Constants';
import '../../Styles/components/Dashboard.css'



// ============================================
// Constants
// ============================================
const SEARCH_MIN_LENGTH = 2;
const HIGHLIGHT_DURATION = 4000;

export default function PDashboard() {

  const {user,logout} = useAuth()

  



  //---State---
  const[bookToEdit,setBookToEdit] = useState(null);
  const[allbooks,setAllBooks] = useState([]);
  const[isMobileAsideOpen,setIsMobileAsideOpen]=useState(false);
  const[activePage,setActivePage]=useState('mybook');
  const[isModalOpen,setIsModalOpen]=useState(false)
  const[notifModal,setNotifModal]=useState(false)
  // const[notificationCount, setNotificationCount] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [searchTerm,setSearchTerm]= useState([]);
  const [searchInputValue,setSearchInputValue] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);
  
  //---Memorized Calues---
  const username = user?.username  || "User"
  const today = new Date();
  const options={
    year:'numeric',
    month:'numeric',
    day:'numeric'
  }
  const formattedDate = today.toLocaleDateString('en-US',options);


  //---Refs---
  const inputRef= useRef(null)
  const rowRefs = useRef({});
  const notificationRef = useRef();
  const asideRef=useRef(null);




const notifmessage = useMemo(()=>[
  {id:1,msg:'harry potter book rejected cause high-price'},
  {id:2,msg:'madison book confirm'},
  {id:3,msg:'Alison (author) confirm'},
  {id:4,msg:'maryam (author) rejected'}
],[])

const notificationCount = useMemo(() => notifmessage.length, [notifmessage]);
  


const closeMobileAside = useCallback(() => {
  setIsMobileAsideOpen(false);
},[])



//---Effects---

// Load Books
  useEffect(()=>{
    const bookslist = localStorage.getItem('accepted-books');
    if(bookslist){
      const availableBooks = JSON.parse(bookslist);
      setAllBooks(availableBooks);
    }else{
      setAllBooks([]);
    }
  },[])






// Clear after Duration
  useEffect(() => {
    if (selectedRowId) {
      const timer = setTimeout(() => {
        setSelectedRowId(null);
        setSearchInputValue(''); 
        setSearchTerm([]);
      }, HIGHLIGHT_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [selectedRowId]);







  // Close aside when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileAsideOpen && asideRef.current && !asideRef.current.contains(event.target)) {
        if (!event.target.closest('.hamburger-menu')) {
          closeMobileAside();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileAsideOpen,closeMobileAside]);







//---Handlers---
    const handleSearch = useCallback((e) => {
 
    const value = e.target.value?.toLowerCase().trim() || '';
    setSearchInputValue(value);
    if(value.length < SEARCH_MIN_LENGTH ){
      setSearchTerm([])
      setSelectedRowId(null)
      return
    }
  

  const foundResult = allbooks.filter(book=>{


    const nameMatch = book.name.toLocaleLowerCase().includes(value);
    const authorMatch = book.author.toLocaleLowerCase().includes(value);

    return   nameMatch || authorMatch;        //categoryMatch

    }) 

    
      setSearchTerm(foundResult);
      setSelectedRowId(null)
  
    },[allbooks])


    const handleKeyPress = useCallback((e)=>{
      if(e.key === 'Enter' && searchInputValue.trim().length >= 2){
        
        const searchValue = searchInputValue.trim().toLowerCase();
        const foundBook = allbooks.find(book=>{
          
          const nameMatch = book.name.toLocaleLowerCase().includes(searchValue);
          const authorMatch = book.author.toLocaleLowerCase().includes(searchValue);
          return  nameMatch || authorMatch;  //categoryMatch 
        })

        if (foundBook){
          setActivePage('mybook')
          setSelectedRowId(foundBook.id);

          setTimeout(() => {
            const rowElement = rowRefs.current[foundBook.id];
            if (rowElement) {
              rowElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }, 100);
        }
      
      }
    },[allbooks,searchInputValue])





  const handleDeleteBooks = useCallback((bookId)=>{
    const updateBooks = allbooks.filter(book=> book.id !== bookId);
    setAllBooks(updateBooks);
    localStorage.setItem('accepted-books',JSON.stringify(updateBooks));
    notificationRef.current.showNotif('Book removed successfully','success');
    setActivePage('mybook')

  },[allbooks])

  const PageChanger = useCallback((newpage)=>{
    setActivePage(newpage)
  },[])




  const handleOpen = useCallback(()=> setIsModalOpen(true),[])
  const handleClose = useCallback(()=> setIsModalOpen(false),[])
  
  const toggleMobileAside = useCallback(() => {
    setIsMobileAsideOpen(!isMobileAsideOpen);
  },[isMobileAsideOpen])
  
  const handlenotifOpen = useCallback(()=> setNotifModal(true),[])
  const handlenotifClose = useCallback(()=>setNotifModal(false),[])
  
  


    const handleEditBooks = useCallback((book)=>{
      setBookToEdit(book);
      setActivePage('upload')
    },[])
  

    const clearEditMode = useCallback(()=>{
      setBookToEdit(null);
    },[])
  



  const togglePage =useCallback((page)=>{
      setActivePage(page);
      if(page === 0){
        setBookToEdit(null);
      }
  },[])





  const AsideContent = () => (
    <aside>
      <div className="profile-pic">
        <img 
          src={ppic14}
          alt=""
          loading='lazy' 
        />
      </div>
      <ul>
        <li><Link to="#" onClick={handleOpen}>Profile</Link></li>
        <li><Link to="#" onClick={()=>togglePage('mybook')}>Mybook</Link></li>
        <li><Link to="#" onClick={()=>togglePage('upload')}>Upload</Link></li>
        <li><Link to="#" onClick={()=>togglePage('authors')}>Authors</Link></li>
        <li className='logout'>
          <Link to="#" onClick={logout}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/>
            </svg>
          </Link>
        </li>
      </ul>
    </aside>
  );



  return (
    <div  >
      <div className='main-container'>
        {/* Main Content */}
        <div className="main-text">
        <h2 className='greet'>Hi {username}</h2>

        {/* Search Bar */}
        <div className="search-container">
           <div className="left-icons-group">
              <li onClick={handlenotifOpen} style={{ cursor: 'pointer' }}>
                  <IconButton>
                      <Badge badgeContent={notificationCount} color="error">
                        <NotificationsIcon  fontSize="medium" sx={{color:'white'}}  />
                      </Badge>
                  </IconButton>
              </li>
            </div>

            {/* CENTER - Search Bar */}
            <div className="search-bar">
              <div className="search-icon">
                <div className="icon_se">
                  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="24">
                    <path d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                  </svg>
                </div>
                <input 
                  type="text"
                  className="search-input"
                  placeholder="author,book"
                  inputref={inputRef}
                  value={searchInputValue}
                  onChange={handleSearch}
                  onKeyDown={handleKeyPress}
                />
                </div>
            </div>

            {/* RIGHT SIDE - Hamburger Menu (date is hidden on mobile) */}
            <span className='date'>{formattedDate}</span>
            <div className="right-icons-group">
              <div className="hamburger-menu" onClick={toggleMobileAside}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  height="24px" 
                  viewBox="0 -960 960 960" 
                  width="24px" 
                  fill="white"
                >
                  <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Content Page */}
          {activePage === "mybook" && (
            <>
              <p>Joined PN in: January 2024</p>
              <div className='table-container'>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Author</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                  {allbooks.map(book=>(
                    <tr 
                      key={book.id}
                      ref={el => rowRefs.current[book.id] =el}
                      className={selectedRowId === book.id ? 'highlight-row':''}
                    >
                      <td>{book.name}</td>
                      <td>{book.author}</td>
                      <td>{book.type}</td>
                      <td>{book.price}$</td>
                      <td>
                        <button 
                          onClick={()=>handleEditBooks(book)}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                    
                    

                  </tbody>
                </table>
              </div>
            </>
          )}

          {activePage === 'upload' && 
            <Upload 
             bookToEdit={bookToEdit}
              handleEditBooks={handleEditBooks}
              handleDeleteBooks={handleDeleteBooks}
              clearEditMode={clearEditMode}
              PageChanger={PageChanger}
            />
          }

          {activePage === 'authors' && <Authors/>}
        </div>

        {/* Desktop Menu */}
        <div className="menu-bar">
          <AsideContent />
        </div>
      </div>

      {/* Mobile Aside */}
      <div className={`mobile-aside-overlay ${isMobileAsideOpen ? 'open' : ''}`} onClick={closeMobileAside}>
        <div className={`mobile-aside-panel ${isMobileAsideOpen ? 'open' : ''}`} ref={asideRef} onClick={(e) => e.stopPropagation()}>
          <div className="close-aside-btn" onClick={closeMobileAside}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="white">
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
            </svg>
          </div>
          <AsideContent />
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && <Profile open={isModalOpen} onClose={handleClose}  />}
      {notifModal && (
         <NotifModal 
            open={notifModal} 
            onClose={handlenotifClose} 
            notifmessage={notifmessage}
          />
        )}

      <Notification ref={notificationRef} />
    </div>
  );
}