// ✅

import React, { useRef, useEffect, useState } from 'react';
import { useNavigate} from 'react-router-dom';



// ---Style---
import '../../Styles/components/ReusableSliderPortrait.css';


// ============================================
//    Main Component
// ============================================
export default function ReusableSliderPortrait({ 
  items,           
  title,           
  viewAllLink,     
  customClass = '',
  cardWidth = '280px',
  portrait
}) {

  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [isPortraitFaded, setIsPortraitFaded] = useState(false);


// ---Scroll Detect for Portrait Fade---
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;


    const checkScrollPosition = () => {
      
      const scrollLeft = carousel.scrollLeft;
      const portraitElement = carousel.querySelector('.portrait-image2');

      if(!portraitElement) return;

    
      const portraitWidth = portraitElement.offsetWidth;
      const threshold = portraitWidth - 50;

      if(scrollLeft > threshold){
        setIsPortraitFaded(true);
      }else{
        setIsPortraitFaded(false);
      }

    };

      // Initial check
      checkScrollPosition();

      // Add scroll event listener
      carousel.addEventListener('scroll',checkScrollPosition);

      return ()=>{
        carousel.removeEventListener('scroll', checkScrollPosition);
      }

  }, []);



 // --- Navigation Handler ---
 const handleCardClick = (link) => {
  if (link) {
    navigate(`/book/${link}`);
  }
};






  return (
    <section className={`slider-section2 ${customClass}`}>
      {/* Header */}
      <div className={`section-header2 ${customClass}`}>
        <h3 className="header-text2">{title}</h3>
        <a href={viewAllLink} className='view-all2'>
          <small>more {'>'}</small>
        </a>
      </div>

      {/* Carousel */}
      <div className="carousel-container2">
        <div className="card-carousel2" ref={carouselRef}>
          {/* Portrait Image */}
          {portrait && (
            <img 
              src={portrait} 
              alt="portrait" 
              className={`portrait-image2 ${isPortraitFaded ? 'faded' : 'normal'}`}
              loading='lazy'
            />
          )}
          
          {/* Cards Container */}
          <div className="scrollable-cards2">
            {items.map((item, i) => (
              <React.Fragment key={item.id || i}>
                <div 
                  key={item.id}
                  className={`card-slider2 ${customClass}`}
                  onClick={() => handleCardClick(item.link)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="card-image-wrapper2">
                    <img 
                      src={item.img}
                      alt={item.title}
                      id="card-main2"
                      loading='lazy'
                    />
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.price}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}