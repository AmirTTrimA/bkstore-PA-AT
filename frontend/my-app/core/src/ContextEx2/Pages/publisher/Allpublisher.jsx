// ✅
import React,{useMemo} from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../Components/Navbar'
import SimpleNav from '../../Components/SimpleNav'
import Footer from '../../Components/Footer'
import "../../Styles/components/AllPublisher.css"
import {
  pub1, pub10, pub2,
  pub3, pub4, pub5,
  pub6, pub7, pub8,
  pub9
} from '../../Constants'




// ============================================
//     Mock Data
// ============================================
export const allPublishers=[
  {id:1,name:'ofogh',imgUrl:pub1},
  {id:2,name:'porteghal',imgUrl:pub2},
  {id:3,name:'avanameh',imgUrl:pub3},
  {id:4,name:'nasle no',imgUrl:pub4},
  {id:5,name:'negah',imgUrl:pub5},
  {id:6,name:'cheshmeh',imgUrl:pub6},
  {id:7,name:'mah ava',imgUrl:pub7},
  {id:8,name:'khili sabz',imgUrl:pub8},
  {id:9,name:'noon',imgUrl:pub9},
  {id:10,name:'rozane',imgUrl:pub10},

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
                        key={item.id}
                        to={`/publisher/${item.id}`}
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
