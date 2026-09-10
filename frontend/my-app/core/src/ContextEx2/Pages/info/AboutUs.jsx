import React,{ useEffect }  from 'react'
import { about_bg } from '../../Constants';
import { about_icon } from '../../Constants';
import { useLanguage } from '../../Context/LanguageContext';
import '../../Styles/components/AboutUs.css'




// ============================================
//    Main
// ============================================
export default function AboutUs() {
  const { isPersian } = useLanguage();

  // ---Effects---
  // define in globals.css
  useEffect(()=>{
    document.body.classList.add('about-us-page');
    document.body.style.setProperty('--bg-image',`url(${about_bg})`);
    return ()=>{
      document.body.classList.remove('about-us-page');
      document.body.style.removeProperty('--bg-image');

    }
  },[])




  return (
    <>
      <div className="about-us-container" style={{ direction: isPersian ? 'rtl' : 'ltr' }}>
          <div className="about-us-single-pic">
            <img 
              src={about_icon}
              alt="logo-didnt-load"
              loading='lazy'  
            />
          </div>
          <div className="about-us-text">
            <span className='about-us-text-title'>
              {isPersian ? 'به بوک‌کده خوش آمدید' : 'Welcome to Bookkadeh'} 
            </span>
            <span>
              {isPersian
                ? 'کتابخانه شخصی شما. بزرگ‌ترین پلتفرم فرهنگی با بیش از ۵۰ هزار کاربر آنلاین و بالغ بر ۵۰۰ عنوان کتاب چاپی، الکترونیکی و صوتی در موضوعات متنوع ادبی، علمی و مهندسی نرم‌افزار. فرصتی طلایی برای دوستداران کتاب در هر زمان و هر مکان.'
                : 'Your Personal Library. A vibrant community with more than 50k online users, containing over 500 kinds of books. You can read in physical or ebooks and buy whatever you want. The best opportunity if you fall in love with books, anytime, anywhere.'}
            </span>
          </div>
      
      </div>
    </>
  )
}
