// ✅
import React,{ useEffect }  from 'react'
import '../../Styles/components/AboutUs.css'




// ============================================
//    Main
// ============================================
export default function AboutUs() {

  // ---Effects---
  // define in globals.css
  useEffect(()=>{
    document.body.classList.add('about-us-page');
    return ()=>{
      document.body.classList.remove('about-us-page');

    }
  },[])




  return (
    <>
      <div className="about-us-container">
          <div className="about-us-single-pic">
            <img 
              src='/about-us-icon.png'
              alt="logo-didnt-load"
              loading='lazy'  
            />
          </div>
          <div className="about-us-text">
            <span className='about-us-text-title'>
              Welcome to PN 
            </span>
            <span>
              
              your Pesonal Library.
              A huge fan site with more than 50k online users,
              containing over 500 kinds of books. 
              You can read in physical or ebooks and buy whatever you want. Its the best opertunity
              if you fall in love with books ,anttime, anywhere.

            </span>
          </div>
      
      </div>
    </>
  )
}
