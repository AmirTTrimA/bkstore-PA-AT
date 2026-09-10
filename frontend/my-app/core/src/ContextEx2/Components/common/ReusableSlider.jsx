// ✅
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ---Style---
import '../../Styles/components/ReusableSlider.css';
import { formatPrice } from '../../utils/formatPrice';


// ============================================
//    Constants
// ============================================
const SCROLL_AMOUNT = 300;



// ============================================
//    Helper Functions
// ============================================
const scroll = (ref, direction) => {
  if (ref.current) {
    
    const newScrollLeft = direction === 'left' 
      ? ref.current.scrollLeft - SCROLL_AMOUNT 
      : ref.current.scrollLeft + SCROLL_AMOUNT;
    
    ref.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  }
};


// ============================================
//    Main Component
// ============================================
export default function ReusableSlider({ 
  items,           
  title,           
  viewAllLink,     
  customClass = '',
  cardWidth = '280px',

}) {

    const navigate = useNavigate();
    const carouselRef = useRef(null);
  



    // ---Handlers---
    const handleCardClick =(link)=>{
      if(link){
        navigate(`/book/${link}`)
      }
    }

    const handleAuthor =(e,authorId)=>{
      e.preventDefault();
      e.stopPropagation();
      navigate(`/author/${authorId}`);
    }





return (
  <section className={`slider-section ${customClass}`}>
    {/* Header */}
    <div className={`section-header ${customClass} `}>
      <h3 className="header-text">{title}</h3>
      <button
        onClick={() => navigate(viewAllLink)}
        className='view-all'
        type="button"
      >
        <small>more {'>'}</small>
      </button>
    </div>

    {/* Carousel */}
    <div className="carousel-container" id='small-slider'>
        {/* Left Navigation */}
        <button  
          className="nav-btn left"
          onClick={() => scroll(carouselRef, "left")}
        >
          ◀ 
        </button>
        {/* Cards Container */}
        <div 
          className="card-carousel" 
          ref={carouselRef}
          style={{ 
            '--card-width': cardWidth 
          }}
        >
          {items.map((item, i) => (
            
            // Card Slider  
            <div 
              key={i}
              className={`card-slider ${customClass}`}
              onClick={() => handleCardClick(item.link)}
              role="button"
              tabIndex={0}
              >
              {/* Image Container */}
              <div className="card-image-wrapper" style={{ position: "relative" }}>
                  {item.has_discount && item.discount_percent > 0 && (
                    <span className="slider-discount-badge">
                      -{item.discount_percent}%
                    </span>
                  )}
                  <img 
                    src={item.img} 
                    alt={item.title}
                    id="card-main" 
                    loading='lazy'
                   />
                  <img 
                    src={item.author_profile}
                    onClick={(e)=>handleAuthor(e,item.authorId)} 
                    alt="profile pic" 
                    id="card-profile"
                    loading='lazy'
                  />
                </div>
                {/* Card Content */}
                <h4>{item.title}</h4>
                {item.match_reasons && item.match_reasons.length > 0 && (
                  <div className="slider-match-badge" title={item.match_reasons.join(" • ")}>
                    <span className="slider-match-text">
                      💡 {item.match_reasons[0]}
                    </span>
                  </div>
                )}
                <div className="slider-pricing-row">
                  {item.has_discount && item.original_price ? (
                    <>
                      <span className="slider-original-price">
                        {item.original_price}
                      </span>
                      <p className="slider-discounted-price">
                        {typeof item.price === 'number' || (!isNaN(Number(item.price)) && !String(item.price).includes(' ')) ? formatPrice(item.price) : item.price}
                      </p>
                    </>
                  ) : (
                    <p>{typeof item.price === 'number' || (!isNaN(Number(item.price)) && !String(item.price).includes(' ')) ? formatPrice(item.price) : item.price}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      
        {/* Left Navigation */}
        <button  
          className="nav-btn right"
          onClick={() => scroll(carouselRef, "right")}
        > 
          ▶ 
        </button>
      
    </div>
  </section>
);


}















