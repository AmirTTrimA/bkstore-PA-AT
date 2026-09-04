// ✅
import React,{useState,useRef,useEffect, useCallback} from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import Basket from '../buy/Basket';
import Profile from './profile/Profile';
import Addresses from './addresses/Addresses';
import Financial from './financial/Financial';
import {ThemeToggle} from '../../Components/common/ThemeToggle'
import { ppic14 } from '../../Constants';

import '../../Styles/components/Dashboard.css'


// ============================================
//    Constants
// ============================================
const TABLE_BOOKS = [
  {id:1,name:'Harry-Potter',author:'J.K Rolling',category:'Romance',lastpage:'32',type:'physical',pdfid:"1"},
  {id:2,name:'Life-Science',author:'A.B scott',category:'Science',lastpage:'10',type:'pdf',pdfid:2},
  {id:3,name:'Simple-Bug',author:'Selfish-men',category:'Science-fiction',lastpage:'00',type:'physical',pdfid:3},
  {id:4,name:'ESi-Boy',author:'josie mean',category:'Tech',lastpage:'40',type:'pdf',pdfid:3},
  {id:5,name:'Dutch-Grammer',author:'Felian forse',category:'Educational',lastpage:'89',type:'pdf',pdfid:4},
  {id:6,name:'Scooby-doo',author:'Adam derek',category:'Childish-story',lastpage:'05',type:'physical',pdfid:5},
]

const SEARCH_MIN_LENGTH = 2;
const HIGHLIGHT_DURATION = 4000;



// ============================================
//    Main Component
// ============================================
export default function Dashboard() {




  const {user,logout} = useAuth()


  const inputRef= useRef(null);
  const rowRefs = useRef({});
  const asideRef=useRef(null);

  const navigate = useNavigate();




//---State---

  // eslint-disable-next-line no-unused-vars
  const [searchTerm,setSearchTerm]= useState([]);
  const [searchInputValue,setSearchInputValue] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [activePage,setActivePage]=useState('home');
  const [isModalOpen,setIsModalOpen]=useState(false)
  const [walletModal,setWalletModal] = useState(false);
  const [isMobileAsideOpen,setIsMobileAsideOpen]=useState(false);



  //---Memorized---
  const username = user?.username  || "User"
  const today = new Date();
  const options={
    year:'numeric',
    month:'numeric',
    day:'numeric'
  }

  const formattedDate = today.toLocaleDateString('en-US',options);




// ---Effects---


// Clear row highlight
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
        // Check if click is on hamburger button
        if (!event.target.closest('.hamburger-menu')) {
          closeMobileAside();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
}, [isMobileAsideOpen]);





// ---Handlers---
  const handleSearch =useCallback((e) => {
    const value = e.target.value?.toLowerCase().trim() || '';
    setSearchInputValue(value);
    if(value.length < SEARCH_MIN_LENGTH ){
      setSearchTerm([])
      setSelectedRowId(null)
      return
    }
  

  const foundResult = TABLE_BOOKS.filter(book=>{


    const categoryMatch = book.category.toLocaleLowerCase().includes(value);
    const nameMatch = book.name.toLocaleLowerCase().includes(value);
    const authorMatch = book.author.toLocaleLowerCase().includes(value);

    return  categoryMatch || nameMatch || authorMatch;

    }) 

    
      setSearchTerm(foundResult);
      setSelectedRowId(null)
  
  },[])


  const handleKeyPress = useCallback((e)=>{
      if(e.key === 'Enter' && searchInputValue.trim().length >= SEARCH_MIN_LENGTH)
      {
        
        const searchValue = searchInputValue.trim().toLowerCase();
        const foundBook = TABLE_BOOKS.find(book=>{
          const categoryMatch = book.category.toLocaleLowerCase().includes(searchValue);
          const nameMatch = book.name.toLocaleLowerCase().includes(searchValue);
          const authorMatch = book.author.toLocaleLowerCase().includes(searchValue);
          return categoryMatch || nameMatch || authorMatch;
        })

        if (foundBook){
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
  },[searchInputValue])


  
  const togglePage =(page)=>{
    setActivePage((prev)=> prev === 'home' ? page : 'home');
  }
  




  const handleOpen = ()=> setIsModalOpen(true)
  const handleClose = ()=>setIsModalOpen(false)
  const handleWalletOpen =()=> setWalletModal(true);
  const handleWalletClose =()=> setWalletModal(false);




  const toggleMobileAside = () => {
    setIsMobileAsideOpen(!isMobileAsideOpen);
  }

  const closeMobileAside = () => {
    setIsMobileAsideOpen(false);
  }


  const goToBook = useCallback((bookId)=>{
    const book = TABLE_BOOKS.find(b=>b.id === bookId)
    if(book){
      navigate(`/pdf/${book.pdfid}`)
    }else{
      // notificationRef.current.showNotif('Try again','warning') 
      console.log('try again');
    }
  },[navigate])


// ============================================
//    Render Helpers
// ============================================
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
        <li><Link to='#' onClick={handleOpen}>profile</Link></li>
        <li><Link to='/subscription'>subscription</Link></li>
        <li><Link to='/favorites'>favorite</Link></li>
        <li><Link to='#' onClick={()=>togglePage('addresses')}>addresses</Link></li>
        <li className='logout'>
          <Link to='#' onClick={logout}>
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
              <li onClick={()=>togglePage('basket')} style={{ cursor: 'pointer' }}>
                {activePage === 'home' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px">
                    <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" height="30px"  viewBox="0 -960 960 960" width="24px" fill="white">
                    <path d="M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Zm80-400h160v-240H200v240Zm400 320h160v-240H600v240Zm0-480h160v-80H600v80ZM200-200h160v-80H200v80Zm160-320Zm240-160Zm0 240ZM360-280Z"/>
                  </svg>
                )}
              </li>
              
             
              
              <li onClick={handleWalletOpen}>
              <svg width="30px" height="30px" viewBox="0 0 24 24" fill="#939393" stroke="white" strokeWidth="2">
                <path d="M22 12v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5Z"/>
                <path d="M20 12h-4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h4"/>
                <path d="M18 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2"/>
              </svg>
              </li>


              <li>
                <ThemeToggle page="dash" />
              </li>
            </div>

            {/* Center - Search Bar */}
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
                  placeholder="Search"
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
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="white">
                  <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Content Pages */}
          {activePage === "home" && (
            <>
              <p>Member since: January 2024</p>
              <p>back to <Link to='/home' className='return-login-link'>Home</Link></p>
              <div className='table-container'>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Last Page</th>
                      <th>Explore</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TABLE_BOOKS.map(book=>(
                      <tr 
                        key={book.id}
                        ref={el => rowRefs.current[book.id] =el}
                        className={selectedRowId === book.id ? 'highlight-row':''}
                        >
                        <td>{book.name}</td>
                        <td>{book.author}</td>
                        <td>{book.category}</td>

                        {book.type==="physical"?(
                          <>
                            <td>
                              <p>--</p>
                            </td>
                            <td>
                              <p>--</p>
                            </td>
                          </>

                        ):(
                          <>
                        <td>{book.lastpage}</td>
                        <td>
                          <button onClick={()=>goToBook(book.id)}>READ</button>
                        </td> 
                        </>
                        )}
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {activePage === 'basket' && <Basket />}
          {activePage === 'addresses' && <Addresses/>}
        </div>

        {/* Desktop Menu */}
        <div className="menu-bar">
          <AsideContent />
        </div>
      </div>

      {/* Mobile Slide-out Aside */}
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
      {isModalOpen && <Profile open={isModalOpen} onClose={handleClose} />}
      {walletModal && <Financial open={walletModal} onClose={handleWalletClose}/> }

    </div>
  );
}