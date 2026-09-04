// ✅
import React, { useState,useCallback,useRef,useEffect } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import { motion } from "framer-motion";

// ---Components---
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer';
import ReusableSlider from '../../Components/common/ReusableSlider';
import Notification from '../../Components/feature/Notification';
import { useAuth } from '../../Context/AuthContext';
import  {ThemeToggle}  from '../../Components/common/ThemeToggle';

// ---Styles---
import '../../Styles/components/Home.css'

// ---Animations---
import { 
  containerVariants,
  cardVariants,
  ux_TitleVariants,
  numberVariants 
} from '../../../animations';

// ---Data---
import { search_results } from '../search/Search';

import {
  pic1,pic10,pic11,
  pic12,pic13,pic14,
  pic2,pic3,pic4,
  pic5,pic6,pic7,
  pic8,pic9,ppic1,
  ppic10,ppic11,ppic12,
  ppic2,ppic3,ppic4,
  ppic5,ppic6,ppic7,
  ppic8, ppic9
} from '../../Constants'

import { 
  cat1,cat2,cat3,
  cat4,cat5,cat6,
  cat7,cat8,cat9
} from '../../Constants';






// ---Constants---

const BOOKS=[
  {name:'ahmad',imageUrl:pic1},
  {name:'jk-rollings',imageUrl:pic2},
  {name:'jojo',imageUrl:pic3},
  
]

const CATEGORIES=[
  {title:'history',iconpath:cat1},
  {title:'sciense-education',iconpath:cat2},
  {title:'art-design',iconpath:cat3},
  {title:'psychology',iconpath:cat4},
  {title:'tech',iconpath:cat5},
  {title:'trip-geo',titlemap:['trip','geo','geography'],iconpath:cat6},
  {title:'financial',iconpath:cat7},
  {title:'religious',iconpath:cat8},
  {title:'novel',iconpath:cat9},
  
]



const INTRODUCE=[
  {id:1,value:"+500",label:'online-user',color:'purple'},
  {id:2,value:"+50",label:'author',color:'#00a859'},
  {id:3,value:"+1000",label:'satisfy-customer',color:'#003ee9'},
  {id:4,value:"+4",label:'years experience',color:'red'},
]


const USER_EXPERIENCE=[
  { username:'mohsen', experience:'thanks pn for access millions book' },
  {username:'hosein' , experience:'fantastic quality in pdf-reading' },
  {username:'ehsan' , experience:'the subscription pay is satisfying' },
]



const SLIDER_ITEMS = [
  { id:1, title: "jules and nothing", price: "40$",link: "1",authorId:1, author_profile:ppic2, img:pic1},
  { id:2 ,title: "harry potter", price: "50$",link:"2",authorId:2,  author_profile:ppic1, img: pic2},
  { id:3 ,title: "operation os", price: "30$",link:"3",authorId:3, author_profile:ppic3, img:pic3},
  { id:4 ,title: "dsa", price: "25$",link: "4", authorId:2, author_profile:ppic4, img:pic4},
  { id:5 ,title: "gfsd", price: "60$",link: "4", authorId:1,author_profile:ppic5, img:pic5},
  { id:6 ,title: "dsafa", price: "20$",link: "5", authorId:3,author_profile:ppic6, img:pic6},
  { id:7 ,title: "dada", price: "55$",link: "6", authorId:2, author_profile:ppic7, img:pic7},
];

const SLIDER_ITEMS2 = [
  { id:1 ,title: "jules and nothing2", price: "40$", link: "7",authorId:1, author_profile:ppic8, img:pic8 },
  { id:2 ,title: "harry potter", price: "50$", link: "5",authorId:3 , author_profile:ppic9, img:pic9},
  { id:3 ,title: "operation os", price: "30$", link: "6",authorId:1, author_profile:ppic10, img:pic10 },
  { id:4 ,title: "dsa", price: "25$", link: "2",authorId:1 , author_profile:ppic11, img:pic11},
  { id:5 ,title: "gfsd", price: "60$", link: "1" ,authorId:2 , author_profile:ppic12, img:pic12},
  { id:6 ,title: "dsafa", price: "20$", link: "4",authorId:3 , author_profile:ppic2, img:pic13},
  { id:7 ,title: "dada", price: "55$", link: "3" ,authorId:2 , author_profile:ppic3, img:pic14},
];





// ============================================
// ---Main Components---
// ============================================

export default function Home() {

  const navigate = useNavigate();
  const inputRef= useRef(null);
  const {isLoggedIn}=useAuth();
  const notificationRef = useRef();




// ---States---
  const [searchInputValue,setSearchInputValue] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [searchTerm,setSearchTerm]= useState([]);
  const [currentSlide,setCurrentSlide] = useState(0)
  const [isHovered,setIsHovered]=useState(false)
  

// ---Static Data---
  const books = BOOKS;
  const category = CATEGORIES;
  const introduce = INTRODUCE;
  const user_experience = USER_EXPERIENCE;
  const slider_items = SLIDER_ITEMS;
  const slider_items2 = SLIDER_ITEMS2;
  const totals = books.length;
 


// ---Search Handlers---
  const handleSearch = (e) => {
    const value = e.target.value?.toLowerCase().trim() || '';
    setSearchInputValue(value);
    if(value.length < 2 ){
      setSearchTerm([])
      return
    }
  
  const foundResult = search_results.filter(book=>{
      const idMatch = book.searchId === value
      const categoryMatch = book.category.toLocaleLowerCase().includes(value);
      const nameMatch = book.name.toLocaleLowerCase().includes(value);

      return idMatch || categoryMatch || nameMatch;

    }) 

    setSearchTerm(foundResult);
  
    };


  const handleKeyPress = (e)=>{
    if(e.key === 'Enter' && searchInputValue.trim().length >= 2){
      handleSearchNavigate(searchInputValue.trim())
    }
  };

  const handleSearchNavigate = (searchTerm) => {
    if(searchTerm && searchInputValue.length >= 2){
      navigate(`/search/${encodeURIComponent(searchTerm)}`)
    }
  };


  
// ---Slide Navigation---
  const nextSlide = useCallback(()=> {
    setCurrentSlide(prev=>(prev+1)%totals)
  },[totals])

  
 
// ---Auto Slide---
    useEffect(()=>{
      if (isHovered) return;
      const interval = setInterval(nextSlide,3000);
      return () => clearInterval(interval);
    },[nextSlide,isHovered])


// ---Navigation Handlers---
    const handleCategoryClick = (categoryTitle) => {
      navigate(`/search/${categoryTitle}`);
  };

// ---Handle isLoggedin---
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


// ---Derived State---
    const slide = totals > 0 ? books[currentSlide] : null;



  return (
    <>
  <div>

  
      <main className='Container_home'>
        {/* Navigation */}
          <Navbar/>
        {/* Mobile Top Navigation */}
          <div className="TopRes">
            <nav className='top-res'>
              <div className="up">
                    <a href="/home" className='logo-res'>PageNet</a>
              </div>

              <div className="down">
                  <ThemeToggle page='home'/>
                    <input 
                      type="search"
                      placeholder='type...'
                      className='search-res'
                      inputref={inputRef}
                      value={searchInputValue}
                      onChange={handleSearch}
                      onKeyDown={handleKeyPress}
                    />
                    <button 
                      onClick={()=>navigate('/subscription')} 
                      className='sub-list'
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="24px"
                       >
                        <path 
                          d="M160-240q-50 0-85-35t-35-85v-240q0-50 35-85t85-35h540q50 0 85 35t35 85v240q0 50-35 85t-85 35H160Zm0-80h540q17 0 28.5-11.5T740-360v-240q0-17-11.5-28.5T700-640H160q-17 0-28.5 11.5T120-600v240q0 17 11.5 28.5T160-320Zm700-60v-200h20q17 0 28.5 11.5T920-540v120q0 17-11.5 28.5T880-380h-20Zm-700 20v-240h540v240H160Z"
                        />
                      </svg>
                    </button>
              </div>
            </nav>
          </div>


        {/* Categories Section */}
            <section className='categories-section'>
            <div className="categories-grid" id="home-categories">
                    {category.map(items=>{
                        return (
                          <div 
                            key={items.title}
                            className="category-card"
                            onClick={() => handleCategoryClick(items.title)}
                            role="button"
                          >
                            <div className="category-icon">
                              <img 
                                src={items.iconpath}
                                alt={`${items.title} icon`}
                                loading='lazy'
                              />
                            </div>
                            <div className="category-title">{items.title}</div>
                          </div>
                        )
                    })}
              </div>
            </section>


                    {/* Main Carousel */}
                     <div 
                      className="carousel-container"
                      onMouseEnter={()=>setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                     >
                      {slide? (
                        <div className="carousel-card">
                          <img 
                            className='slide-image'
                            src={slide.imageUrl}
                            alt={slide.name} 
                            loading='lazy'
                          />
                            <h3 className='slide-title'>{slide.name}</h3>
                        </div>
                      ):(
                        <p> no books </p>
                      )}

                        <div className="indicators">
                          {books.map((_,i)=>(
                            <span
                              key={i}
                              className={i === currentSlide ? "dot active":'dot'}
                              onClick={()=> setCurrentSlide(i)}
                           >
                            </span>
                          ))}
                        </div>

                     </div>


            {/* Introduction Stats */}
            <motion.div
              className='introduce-container'
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }} 
              variants={containerVariants}
            >
              {introduce.map((int)=>(
                <motion.div
                  key={int.id}
                  className="int-card"
                  variants={cardVariants}
                  whileHover={{
                    scale: 1.05,
                  }}
                >

                      <motion.h2
                        className="int-value"
                        style={{color:`${int.color}`}}
                        variants={numberVariants}
                      >
                        {int.value}
                      </motion.h2>
                      <motion.p className="int-label">{int.label}</motion.p>

                </motion.div>

              ))}

            </motion.div>



            {/* Sliders */}
            <ReusableSlider 
              items={slider_items}
              title="Top Offer"
              viewAllLink="/TopOffer"
              customClass="home-popular"
              cardWidth="300px"
            />
            
            <ReusableSlider 
              items={slider_items2}
              title="Most Popular"
              viewAllLink="/popular"
              customClass="home-popular"
              cardWidth="300px"
            />
            

        {/* User Experience */}
        <motion.div
            className='ux-container-main'
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }} 
            variants={containerVariants}
        >
              
            <motion.div
                  className='ux-container1'
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }} 
            >
              
                <motion.h2
                    className="ux-value"
                    variants={ux_TitleVariants}
                  >
                    User-Experience
                </motion.h2>
            </motion.div>


            <motion.div
                  className='ux-container2'
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }} 
            >
              
              {user_experience.map((ux)=>(
                  <motion.div
                      key={ux.username}
                      className="ux-card"
                      variants={cardVariants}
                      whileHover={{
                        scale: 1.05,
                      }}
                  >
                    <h3>{ux.username}</h3>
                    <p>{ux.experience}</p>
                </motion.div>

              ))}
            </motion.div>


        </motion.div>


          

        {/* Footer */}
          <Footer/>
      </main> 

      {/* Bottom Navigation (Mobile) */}
        <div className="BottomNav">
          <nav className='bottom-navbar'>
                <Link to="/" className='nav-item'>
                    <i className="fas fa-home"></i>
                    <span>Home</span>
                </Link>

                <Link to='/favorites'
                      onClick={handleLoginCheck}
                      className="nav-item"
                >
                      <i className='fa-solid fa-heart'></i>
                      <span>favorite</span>
                </Link>
                <Link to='/basket' className="nav-item">
                      {/* <svg className="cart-icon" viewBox="0 -960 960 960">
                        <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"/>
                      </svg> */}
                      <i className='fas fa-bag-shopping'></i>
                      <span>Cart</span>
                </Link>

                <Link to='/library' className="nav-item">

                      <i className="fas fa-book"></i> 
                      <span>Library</span>
                </Link>

                <Link to="/dashboard"  
                      onClick={handleLoginCheck}
                      className="nav-item"
                >
                      <i className="fas fa-user"></i>
                      <span>Dashboard</span>
                </Link>
          </nav>
        </div>
        <Notification ref={notificationRef} />
    </div>
    </>
  )
}
