// ✅
import React ,{ useState,useRef,useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from "framer-motion";
import { containerVariants,cardVariants } from '../../../animations';


// ---Components---
import Footer from '../../Components/Footer';
import ReusableSlider from '../../Components/common/ReusableSlider';
import SimpleNav from '../../Components/SimpleNav';
import { useAuth } from '../../Context/AuthContext';
// ---Styles---
import "../../Styles/components/Book.css"
import {mockAuthor} from '../author/Author'
import {allPublishers} from "../publisher/Allpublisher"



import Notification from '../../Components/feature/Notification';
import Navbar from '../../Components/Navbar';

import { 
  pic1,pic2,pic3,
  pic6,pic7,pic4,
  pic5,c1,c2,
  c3,c4,ppic1,
  ppic5,ppic2,ppic3,
  ppic4, ppic6, ppic7,
  pic9, pic10, pic11,
  pic12, pic13, pic17,
  pic21, ppic8, ppic9,
  ppic10, ppic11,
} from '../../Constants';

// ---MockData---
export const mockBook=[
{ id:1,name:'100-days-Alive',
  format:'pdf',pd_price:'20$',
  ph_price:'35$',category:['education','sciense','extar'],
  authorId:3,imageUrl:pic1,pubId:1,
  comments:[
    {
        username:'amin',
        content:'absolutely masterpiece from master orwell'
    },
    {
        username:'mohanna',
        content:'really boring '
    },
    {
        username:'reza',
        content:'not bad at all '
    },
    {
        username:'sheida',
        content:'really except more from orwell'
    },


    ]
},
{ id:2,name:'quran',
  format:'physical',pd_price:'10$',
  ph_price:'15$',category:['religious'],
  authorId:2, imageUrl:pic7,pubId:2,
  comments:[
    {
        username:'hesam',
        content:'good guideness from quran'
    },
    {
        username:'zahra',
        content:'me and my family still use it since 2 years ago'
    },
    {
        username:'zeinab',
        content:'recently buy it nice till now '
    },
    {
        username:'ali',
        content:' i bought it for my son very important as parent effect'
    },


  ]
 
},
{ id:3,name:'1944',
  format:'pdf',pd_price:'30$',
  ph_price:'25$',category:['history','education','horizontal','padding'],   
  authorId:3,imageUrl:pic4,pubId:3,
  comments:[
    {
        username:'tina',
        content:'absolutely masterpiece from master orwell'
    },
    {
        username:'mohsen',
        content:'really boring '
    },
    {
        username:'ahmad',
        content:'not bad at all '
    },
    {
        username:'moretza',
        content:'really except more from orwell'
    },


  ]
  
},
{ id:4,name:'eslam',
  format:'pdf',pd_price:'15$',
  ph_price:'10$',category:['religious'],
  authorId:2,imageUrl:pic5,pubId:4,
  comments:[
    {
        username:'parsa',
        content:'absolutely masterpiece from master orwell'
    },
    {
        username:'parviz',
        content:'really boring '
    },
    {
        username:'sohrab',
        content:'not bad at all '
    },
    {
        username:'tiam',
        content:'really except more from orwell'
    },


  ]
  
},
{ id:5,name:'eslam2',
  format:'physical',pd_price:'10$',
  ph_price:'11$',category:['religious','education'],
  authorId:1,imageUrl:pic6,pubId:5,
  comments:[
    {
        username:'iman',
        content:'absolutely masterpiece from master orwell'
    },
    {
        username:'mahdi',
        content:'really boring '
    },
    {
        username:'navid',
        content:'not bad at all '
    },
    {
        username:'alireza',
        content:'really except more from orwell'
    },


  ]
  
},
 ]

//  ---Constants---
const MOBILE_BREAKPOINT = 768;

// ============================================
//    Main Components
// ============================================
export default function Book() {


  // ---Hooks---
  const {bookId}=useParams();
  const {isLoggedIn}=useAuth();
  const navigate=useNavigate();
  const notificationRef = useRef(null);

  
  //  ---State---
  const[book,setBook]= useState(null)
  const[liked,setLiked]=useState(false)
  const[commentlike,setCommentLike]=useState(0)
  const[commentdislike,setCommentDislike]=useState(0)
  const[commenttext,setCommentText]=useState("")
  const[format,setFormat]=useState('')
  const[formatOpen,setFormatOpen]= useState(false) 
  const[price,setPrice]=useState('')
  const[isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT)    //Responsive
  const[showallcomments,setShowAllComments]=useState(false)
  const priceref=useRef('');
  

    


   
// ---Effects---

// 1-handle window resize for mobile
    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);



// 2-fetch book (later replace with api)
  useEffect(() => {
      
    const foundBook = mockBook.find(b => b.id === parseInt(bookId));
    
    if (foundBook) {
      const author = mockAuthor.find(a => String(a.id) === String(foundBook.authorId));
      const publisher = allPublishers.find(a => String(a.id) === String(foundBook.pubId));

      setBook({ ...foundBook, author: author, publisher: publisher }); // Attach author object to book
    } else {
      setBook(null); 
    }

  }, [bookId]);

  
// 3-check if book is in favorites
  useEffect(()=>{
    if(book){
      
      const savedFavs = localStorage.getItem('favorite');
      let favorite = [];
    
      if (savedFavs) {
        favorite = JSON.parse(savedFavs);
      }
    
      if (!Array.isArray(favorite)) {
        favorite = [];
      }
    
    
      const isfavorited = favorite.some(fav=> fav.id === book.id)
      setLiked(isfavorited)
    }
  },[book])






// ---Derived State---
    const commentsToShow = showallcomments 
      ? book?.comments 
      : book?.comments.slice(0,3);

    const isButtonDisabled =  !commenttext?.trim();



// ---Handlers---
    const handleFormatChange = useCallback((selectedformat)=>{

      setFormat(selectedformat);

      setPrice(
        selectedformat === 'physical'? book?.ph_price:
        selectedformat === 'pdf'? book?.pd_price:
        ''
      )

      setFormatOpen(false);
      
    },[book])

    const handleFormatChange2 = useCallback((e)=>{

      const selectedformat = e.target.value
      setFormat(selectedformat);

      setPrice(
        selectedformat === 'physical'? book?.ph_price:
        selectedformat === 'pdf'? book?.pd_price:
        ''
      )

      setFormatOpen(false);
      
    },[book])
    


    // Navigation
    const handleAuthor = useCallback(() => {
      if (book && book.author && book.author.id) {
        navigate(`/author/${book.author.id}`); 
      } else {
        console.warn("Author ID not found for navigation.");
      }
    },[book,navigate])



      // Publisher
      const handlePublisher= useCallback(()=>{
        if (book && book.publisher && book.publisher.id) {
        navigate(`/publisher/${book.publisher.id}`)
        } else {
          console.warn("Publisher ID not found for navigation.");
        }

      },[book,navigate])



    // Comments
    const handlecomment = useCallback(()=>{
      if(!isLoggedIn){
        notificationRef.current.showNotif(' require','error',{
          linkText:"login",
          linkHref:"/login"
        })
        return 
      }
      

      console.log('posted');
      setCommentText('')
    },[isLoggedIn])




    // Like / Favorite
    const handleLike = useCallback(()=>{
      if(!isLoggedIn){
        notificationRef.current.showNotif(' required','error'
        ,{
          linkText:'login',
          linkHref:'/login'
        })
        return
      }

      let favorite = []
      const savedFav  = localStorage.getItem('favorite');

      if(savedFav){
        favorite  = JSON.parse(savedFav);
      }

      if (!Array.isArray(favorite)) {
        favorite = [];
      }


      if(!liked){
        const newFav = {
            id:book.id,
            name:book.name,
            imageUrl: book.imageUrl,
            author: book.author?.name,
            category: book.category
        }

        favorite.push(newFav);
        
        localStorage.setItem('favorite',JSON.stringify(favorite));
        setLiked(true);
        notificationRef.current.showNotif('Added to favorite','success');
      }
      else{
        const updatedfavorites = favorite.filter(fav => fav.id !== book.id);
        localStorage.setItem('favorite', JSON.stringify(updatedfavorites));
        setLiked(false);
        notificationRef.current.showNotif('Removed from favorites', 'warning');
      }


      
    },[book,isLoggedIn,liked])






  // Category
    const handleCategory= useCallback((category)=>{
    navigate(`/search/${encodeURIComponent(category)}`);
  },[navigate])





  
  // CommentLike
    const handleCommentLike=useCallback(()=>{
      setCommentLike(p=>p+1);
    },[])

    const handleCommentDislike=useCallback(()=>{
      setCommentDislike(p=>p+1);
    },[])

    // Add to cart (temporary)
    const handleAddtoCart = useCallback(()=>{
      notificationRef.current.showNotif("Add to Cart",'success')
    },[])















// ---MockDataSliders---
    const slider_items_same_author = [
      { title: "jules and nothing", price: "40$",link: 1,authorId:1, author_profile:ppic7, img:pic1},
      { title: "harry potter", price: "50$",link:2,authorId:2, author_profile:ppic1, img:pic2},
      { title: "operation os", price: "30$",link:3,authorId:3, author_profile:ppic8, img:pic3 },
      { title: "freakin web", price: "25$",link: '4',authorId:2, author_profile:ppic9, img:pic4},
      { title: "monster", price: "60$",link: '5',authorId:3, author_profile:ppic10, img:pic10},
      { title: "sparta", price: "20$",link: '6',authorId:1, author_profile:ppic11 , img:pic11},
];
    const slider_items_same_vibe = [
      { title: "jules and nothing", price: "40$",link: "1",authorId:1
      ,img:pic9
      ,author_profile:ppic5
      },
      { title: "harry potter", price: "50$",link:"2",authorId:2
      ,img: pic2
      ,author_profile:ppic1
      },
      { title: "operation os", price: "30$",link:'3',authorId:3
      ,img: pic3
      ,author_profile:ppic2
      },
      { title: "dsa", price: "25$",link:'4',authorId:2
      ,img:pic12
      ,author_profile:ppic3
      },
      { title: "gfsd", price: "60$",link:'5',authorId:1
      ,img:pic13
      ,author_profile:ppic4
      },
      { title: "dsafa", price: "20$",link:'6',authorId:3
      ,img:pic17
      ,author_profile:ppic6
      },
      { title: "dada", price: "55$",link:'7',authorId:3
      ,img:pic21
      ,author_profile:ppic7
      },
];



   



   





// ---PopupCards---
    const corner_list =[
      {id:1,imageUrl:c1,price:'100'},
      {id:2,imageUrl:c2,price:'50'},
      {id:3,imageUrl:c3,price:'35'},
      {id:4,imageUrl:c4,price:'29'},
    
    ]






// book not found [at end cause make condition and nothing after that can define]
      if (!book) {
        return <div>Loading book details or book not found...</div>;
      }









    return (
    <div>

        <div className="book-nav-res"><SimpleNav/></div>

      <div className="book-container">

        <div className="book-nav-full"><Navbar/></div>

          {/* Main Content */}
          <div className="main">
            {/* Book Image & Info */}
            <div className="main-book">
              <div className="book-card">
                <img 
                  className='bk-slide-image'
                  src={book.imageUrl}
                  alt={book.name} 
                  loading="lazy"
                />
                <div className="info">
                  <h2 className='bk-slide-title'>{book.name}</h2>
                  {/* Category */}
                  <div className='book-categories'>
                    {book.category.map((category,index)=>(
                      <div 
                       key={index}
                       label={category}
                       onClick={() => handleCategory(category)} 
                       className="book-categories-wrapper"
                     >
                     <p className='book-categories-link'>{category}</p>
                     </div>
                    ))}
                  </div>


                  <div className="author-wrapper">
                    <p 
                      className='extra-info' 
                      id='ext'
                      onClick={()=>handleAuthor()}
                    >
                      {book.author?.name || 'unknown'}
                    </p>
                    <p 
                      className='extra-info' 
                      id='ext'
                      onClick={()=>handlePublisher()}
                    >
                      {book.publisher?.name || 'unknown'}        
                    </p>

                  </div>

                 </div>
                
              
                {/* Like Button */}
                <button 
                  onClick={handleLike} 
                  className={isMobile ? 'mobile-like':'like'}
                >
                  <svg
                    width={isMobile ? "24" : "32"}
                    height={isMobile ? "24" : "32"}
                    viewBox="0 0 24 24"
                    fill={liked ? "red" : "none"}
                    stroke={liked ? "red" : "black"}
                    strokeWidth="2"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                             2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                             C13.09 3.81 14.76 3 16.5 3
                             19.58 3 22 5.42 22 8.5
                             c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </div>
            </div>


          {/* Side Card (Format & Price) */}
            <div className="side-card">
              <div className="chooser">
                <label htmlFor="book-format">Format:</label>
                <select 
                  ref={priceref}
                  value={format}
                  onChange={handleFormatChange2} 
                  name="book-format" 
                  id="book-format">
                  <option value="" disabled defaultValue hidden>choose one</option>
                  
                    <option value="physical">physical</option>
                    <option value="pdf">pdf</option>
                    <option value="audio">audio</option>
                  
                </select>
              </div>
                <span className='show-price'>{price || 'Select format'}</span>
                <button className='book-buy-btn' onClick={()=>handleAddtoCart()}>Add to Cart</button>

            </div>

          </div>
        

      {/* Rest of Page*/}
      <div className="book-rest">
        {/* Corner Cards */}
          <motion.div
              className='corner-cards-container'
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }} 
              variants={containerVariants}
              
          >
              {corner_list.map((cornercard) => (
                    <motion.div
                      key={cornercard.id}
                      className="corner-card-wrapper"
                      variants={cardVariants}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="corner-card-label-topright">
                        {cornercard.price}$
                      </span>

                      <div className="corner-card">
                        <motion.img
                          src={cornercard.imageUrl}
                          whileHover={{ scale: 1.05 }}
                        />
                      </div>
                    </motion.div>
                  ))}

          </motion.div>



          {/* About Book */}
          <div className="about-book">
            <div className="about-book-content">
              <h1>About book</h1>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Egestas purus viverra accumsan in nisl nisi. Arcu cursus vitae congue mauris rhoncus aenean vel elit scelerisque. In egestas erat imperdiet sed euismod nisi porta lorem mollis. Morbi tristique senectus et netus. Mattis pellentesque id nibh tortor id aliquet lectus proin. Sapien faucibus et molestie ac feugiat sed lectus vestibulum. Ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget. Dictum varius duis at consectetur lorem. Nisi vitae suscipit tellus mauris a diam maecenas sed enim. Velit ut tortor pretium viverra suspendisse potenti nullam. Et molestie ac feugiat sed lectus. Non nisi est sit amet facilisis magna. Dignissim diam quis enim lobortis scelerisque fermentum. Odio ut enim blandit volutpat maecenas volutpat. Ornare lectus sit amet est placerat in egestas erat. Nisi vitae suscipit tellus mauris a diam maecenas sed. Placerat duis ultricies lacus sed turpis tincidunt id aliquet. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Egestas purus viverra accumsan in nisl nisi. Arcu cursus vitae congue mauris rhoncus aenean vel elit scelerisque. In egestas erat imperdiet sed euismod nisi porta lorem mollis. Morbi tristique senectus et netus. Mattis pellentesque id nibh tortor id aliquet lectus proin. Sapien faucibus et molestie ac feugiat sed lectus vestibulum. Ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget. Dictum varius duis at consectetur lorem. Nisi vitae suscipit tellus mauris a diam maecenas sed enim. Velit ut tortor pretium viverra suspendisse potenti nullam. Et molestie ac feugiat sed lectus. Non nisi est sit amet facilisis magna. Dignissim diam quis enim lobortis scelerisque fermentum. Odio ut enim blandit volutpat maecenas volutpat. Ornare lectus sit amet est placerat in egestas erat. Nisi vitae suscipit tellus mauris a diam maecenas sed. Placerat duis ultricies lacus sed turpis tincidunt id aliquet.
              </p>
              
              </div>
          </div>









        {/* sliders */}
        <ReusableSlider
          items={slider_items_same_author}
          title="Same Author"
          customClass="same-author"
        
        />
        <ReusableSlider
          items={slider_items_same_vibe}
          title="From Your Taste"
          viewAllLink="/categories"
          customClass="same-vibe"
        
        />
        
        {/* Comments Section */}

        <div className="comment-section">
            <div className="my-comment">
              <textarea 
                type="text"
                className='comment-content'
                placeholder='type...'
                onChange={(e)=>{
                   setCommentText(e.target.value);
                  }}
                value={commenttext}
              />
              <button
                className='comment-btn'
                disabled={isButtonDisabled}
                onClick={handlecomment}
              >
                post
              </button>

              <Notification ref={notificationRef} />

            </div>
            <div className="users-comment">
              {commentsToShow && commentsToShow.map((u,index)=>(
                    <div key={index} className="user-comment">
                        <p className='comment-account'>{u.username}</p>
                        <p className='user-comment-content'>{u.content}</p>
                        <div className="like-dislike-icons-container">
                            <div className="like-dislike-icons">
                                
                                <button 
                                  onClick={handleCommentLike}
                                  className="like-dislike-icons-btn"
                                  >


                              <svg   
                                    xmlns="http://www.w3.org/2000/svg"
                                    width='24'
                                    height='24'
                                    viewBox="0 0 24 24"
                                    // fill="none"
                                    stroke='rgb(180,180,180)'
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M7 10v12" />
                                    <path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                                  </svg>
                                </button>


                           
                                <button 
                                  onClick={handleCommentDislike}
                                  className="like-dislike-icons-btn"
                                >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width='24'
                                  height='24'
                                  viewBox="0 0 24 24"
                                  className="like-dislike-icons-btn-svg"
                                  id='dislike-btn'
                                  // fill="none"
                                  stroke='rgb(180,180,180)'
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17 14V2" />
                                  <path d="M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
                                </svg>
                                </button>
                              </div>


                                <div className="like-dislike-count">
                                  <span className="like-dislike-icons-count">
                                    {commentlike}
                                  </span>
                                  <span className="like-dislike-icons-count">
                                    {commentdislike}
                                  </span>
                                </div>

                            
                        </div>
                        
                    </div>
                  
                ))}
                {/* Show More / Less */}
                {book?.comments && book?.comments.length > 3 && !showallcomments && (
                     <button 
                     className="show-btn"
                     onClick={() => setShowAllComments(true)}
                   >
                     Show more ({book.comments.length - 3})
                   </button>
                )}

                {showallcomments && (
                      <button 
                        className="show-btn"
                        onClick={() => setShowAllComments(false)}
                      >
                        Show Less
                      </button>
                  )}
            </div>
        </div>




      </div>
      {/* Footer */}
      <div className="last">
        <Footer/>
      </div>


      {/* Mobile Navigation */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-content">
          <div className="mobile-format-picker custom-format-picker">
            <button
               className="format-select-button"
               onClick={() => setFormatOpen(prev => !prev)}
            >
              {format || "Select format"}
            </button>
            {formatOpen && (
                <div className="format-options">
                    <button 
                      onClick={() => handleFormatChange("physical")}
                    >
                        physical
                    </button>

                    <button 
                      onClick={() => handleFormatChange("pdf")}
                    >
                      pdf
                    </button>

                    <button 
                      onClick={() => handleFormatChange("audio")}
                    >
                      audio
                    </button>
                </div>
            )}


          </div>
          <div className="mobile-price-cart">
            <span className="mobile-price">{price || 'Select format'}</span>
            <button className="mobile-add-to-cart" onClick={()=>handleAddtoCart()}>Add to Cart</button>
          </div>
        </div>
      </div>






    </div>
  </div>
);
}
