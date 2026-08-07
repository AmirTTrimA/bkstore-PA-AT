// ✅
import React,{useMemo} from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../Components/Navbar'
import SimpleNav from '../../Components/SimpleNav'
import Footer from '../../Components/Footer'
import "../../Styles/components/AllPublisher.css"




// ============================================
//     Mock Data
// ============================================
export const allPublishers=[
  {publisherId:1,name:'ofogh',imgUrl:'data:image/png;base64,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'},
  {publisherId:2,name:'porteghal',imgUrl:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZDqszmEuEfOHk7JUX5p5tRZQg8CL1lvNofw&s'},
  {publisherId:3,name:'avanameh',imgUrl:'data:image/png;base64,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'},
  {publisherId:4,name:'nasle no',imgUrl:'data:image/png;base64,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'},
  {publisherId:5,name:'negah',imgUrl:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyvqu3eRTOwiDiLNODCmE-r0UZZl26jnCRpw&s'},
  {publisherId:6,name:'cheshmeh',imgUrl:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4IYnoBm1BNEc4vQSSCzKhYnN9gl1tUViC5Q&s'},
  {publisherId:7,name:'mah ava',imgUrl:'https://cdn.fidibo.com/phoenixpub/publisher/4d6abcb3-d326-4858-a769-9e107313f7b0/image.jpg'},
  {publisherId:8,name:'khili sabz',imgUrl:'https://cdn.fidibo.com/phoenixpub/publisher/1044b9b6-15cc-40e2-9f7c-07cf7ec56ba3/image.png'},
  {publisherId:9,name:'noon',imgUrl:'https://cdn.fidibo.com/phoenixpub/publisher/21aa59db-978d-4335-b1a6-2a798390e043/image.png'},
  {publisherId:10,name:'rozane',imgUrl:'https://upload.wikimedia.org/wikipedia/fa/c/cf/Rowzaneh_Nashr.jpeg'},

]










// ============================================
//    Main 
// ============================================
export default function AllPublisher() {


  // ---Memoized Data---
  const publishers = useMemo(() => allPublishers, []);



  return (
    <div>
      {/* Mobile Navigation */}
      <div className="all-publisher-res">
        <SimpleNav/>
      </div>

      <div className="all-publisher-container">
              {/* Desktop Navigation */}
              <div className="all-publisher-full">
                <Navbar/>
              </div>
              {/* Main Content */}
              <div className="main-all-publisher-container">
                {/* Header */}
                <div className="publishers-title-container">
                  <span className='publishers-title'>All Valid Publishers of Pagenet</span>
                  <span className='publishers-title-info'>Pagenet is source of check,buy physical and e-book which make able to stydying thousands of book </span>
                </div>


                {/* Publisher Grid */}
                <div className="all-publisher-cards-row">
                    {publishers.map((item)=>(
                      <Link 
                        key={item.publisherId}
                        to={`/publisher/${item.publisherId}`}
                        className="publishers-cards"
                      >
                        <div className="publishers-card-pic">
                          <img 
                            src={item.imgUrl}
                            alt={item.name}
                            loading="lazy"
                           />
                        </div>
                        <div className="publishers-card-info">
                          <span className='publishers-field-name'>{item.name}</span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>


          <Footer/>

          {/* Bottom Navigation (Mobile) */}
          <div className="BottomNavbar">
          <nav className='bottom-nav'>
                <Link to="/home" className="nav-item" >
                    <i className="fas fa-home"></i>
                    <span>Home</span>
                </Link>

                <Link to="/favorites" className="nav-item">
                      <i className='fa-solid fa-heart'></i>
                      <span>favorite</span>
                </Link>

                <Link to="/basket" className="nav-item">
                      <svg className="cart-icon" viewBox="0 -960 960 960">
                        <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"/>
                      </svg>
                      <span>Cart</span>
                </Link>

                <Link to="/library" className="nav-item">
                      <i className="fas fa-book"></i> 
                      <span>Library</span>
                </Link>

                <Link to="/Dashboard" className="nav-item">
                      <i className="fas fa-user"></i>
                      <span>Dashboard</span>
                </Link>


          </nav>
          </div>
      </div>
    </div>
  )
}
