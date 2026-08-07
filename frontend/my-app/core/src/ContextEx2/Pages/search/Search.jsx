import React,{useRef,useEffect, useState,useMemo} from 'react'
import Navbar from '../../Components/Navbar'
import SimpleNav from '../../Components/SimpleNav'
import Footer from '../../Components/Footer'
import { useParams, Link } from 'react-router-dom'


import "../../Styles/components/Search.css"
import { pic9 } from '../../Constants'



// ============================================
// Constants
// ============================================
const MIN_PRICE = 0;
const MAX_PRICE = 1000;

const SORT_OPTIONS = [
  { id: 'cheap', label: 'Cheap' },
  { id: 'expensive', label: 'Expensive' },
  { id: 'latest', label: 'Latest' },
  { id: 'topsell', label: 'Top Sell' },
  { id: 'most visited', label: 'Most Visited' },
];

const FORMAT_OPTIONS = ['physical', 'pdf'];



// ============================================
//    Mock Data
// ============================================
export const search_results=[
  {searchId:"1",name:"harry-potter",category:'novel',price:"60",since:"2020",imgUrl:pic9},
  {searchId:"2",name:"sara life",category:'trip-geo',price:"33",since:"1990",imgUrl:"https://di-uploads-pod11.dealerinspire.com/stevelanderschryslerdodgejeepram/uploads/2017/07/DG018_036CLul7gbtg3iqneobqm1lk3178ng4__mid.jpg"},
  {searchId:"3",name:"KING naser",category:'history',price:"50",since:"2021",imgUrl:"https://cdn.motor1.com/images/mgl/ZXN9K/s3/ford-mustang-shelby-gt500.jpg"},
  {searchId:"4",name:"new way",category:'trip-geo',price:"30",since:"2021",imgUrl:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlPK_MoPTG57Wp_s_WnFgl6bjL378Xb8M6HQ&s"},
  {searchId:"5",name:"citizen art",category:'psychology',price:"29",since:"2019",imgUrl:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWtyoKr8-EgU3I8xH4GlEJiPOqPszxHJLWcw&s"},
  {searchId:"6",name:"Quran",category:'religious',price:"15.09",since:"2002",imgUrl:"https://www.usnews.com/object/image/00000195-1985-dae4-a7d5-d9c784cf0000/p90541178-highres-rolls-royce-arcadia-1.jpg?update-time=1739889995584&size=responsive640"},
  {searchId:"7",name:"AI king",category:'tech',price:"16",since:"2004",imgUrl:"https://www.mad4wheels.com/img/free-car-images/mobile/22103/jas-motorsport-tensei-by-pininfarina-2026-thumb.jpg"},
  {searchId:"8",name:"IOT",category:'tech',price:"17",since:"2007",imgUrl:"https://image-cdn.beforward.jp/large/202603/12708974/CA622571_1d16adb9.jpg"},
  {searchId:"9",name:"police limitations",category:'science-education',price:"80",since:"2018",imgUrl:"https://www.bmw-m.com/content/dam/bmw/marketBMW_M/www_bmw-m_com/topics/magazine-article-pool/2021/e46-gtr-street/bmw-m3-gtr-street-gallery-01.jpg"},
  {searchId:"10",name:"society engineering",category:'psychology',price:"65",since:"2006",imgUrl:"https://sureshdrives.com/blog/wp-content/uploads/2024/12/c200-car-w204.jpg"},
  {searchId:"11",name:"money honey",category:'financial',price:"65",since:"2006",imgUrl:"https://sureshdrives.com/blog/wp-content/uploads/2024/12/c200-car-w204.jpg"},
  {searchId:"12",name:"humanization people",category:'psychology',price:"31",since:"2000",imgUrl:"https://sureshdrives.com/blog/wp-content/uploads/2024/12/c200-car-w204.jpg"},
  {searchId:"13",name:"utility personality",category:'psychology',price:"22",since:"1989",imgUrl:"https://sureshdrives.com/blog/wp-content/uploads/2024/12/c200-car-w204.jpg"},

]




export default function Search() {


  const {searchTerm} = useParams();
  const containerRef = useRef(null);
  
  
  // ---States---
  const [searchvalue,setSearchValue]= useState([]);
  const [isLoading,setIsLoading]=useState(true)
  const [selectedSort,setSelectedSort]= useState('');
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  // Filter states
  const [filterFormat, setFilterFormat] = useState('');
  const [filterPublisher, setFilterPublisher] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');



    // Price range/filter
    const minPrice=useMemo(()=>MIN_PRICE,[]);
    const maxPrice=useMemo(()=>MAX_PRICE,[]);
    const [minValue, setMinValue] = useState(0);
    const [maxValue, setMaxValue] = useState(1000);






// ---Effects---
    useEffect(() => {
      setIsLoading(true);

        if (searchTerm){
          let foundResult = search_results.filter(books=>
            books.searchId === searchTerm ||
            books.category.includes(searchTerm) ||
            books.name.includes(searchTerm) 
            )
            setSearchValue(foundResult);
  
        }else{
          setSearchValue(search_results);
        }
        
        setIsLoading(false);
  
    }, [searchTerm]);
  
  



    // Scroll handler for filter
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleScroll = () => {
          container.classList.add('scrolling');
          clearTimeout(container.timeout);
          container.timeout = setTimeout(() => {
              container.classList.remove('scrolling');
          }, 500);
      };

      container.addEventListener('scroll', handleScroll);
      
      return () => {
          container.removeEventListener('scroll', handleScroll);
          clearTimeout(container.timeout);
      };
  }, []);









  // ---Handlers---
    const handleSortSelect = (sortId) => {
      setSelectedSort(sortId);
      setIsSortSheetOpen(false);
    
  };

  // Apply Filter
  const handleFilterApply = () => {
    setIsFilterSheetOpen(false);
  };



  // price handlers
  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxValue - 1);
    setMinValue(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minValue + 1);
    setMaxValue(value);
  };




  // ---Price Range Calculations---
  const percent1 = ((minValue - minPrice) / (maxPrice - minPrice)) * 83;
  const percent2 = ((maxValue - minPrice) / (maxPrice - minPrice)) * 88;
  
  // mobile
  const percent3 = ((minValue - minPrice) / (maxPrice - minPrice)) * 95;
  const percent4 = ((maxValue - minPrice) / (maxPrice - minPrice)) * 95;


  const thumbRadius = 15; 
  const progressLeft = percent1;
  const progressWidth = percent2 - percent1;

  const thumbRadius2 = 12; 
  const progressLeft2 = percent3;
  const progressWidth2 = percent4 - percent3;




  if(isLoading){
    return <div>Loading ...</div>
  }





  return (
<div>
    {/* Navigation */}
    <div className="search-nav-res">
      <SimpleNav/>
    </div>
  <div className="search-full-container">

      <div className="search-nav-full">
        <Navbar/>
      </div>

    {/* Main Content */}
    <div className="main-search-container">
      <div className="main-search">
        {/* Sort Row (Desktop) */}
          <div className="sort-row">
              <p>sort by :</p>
              <ul>
              {SORT_OPTIONS.map(opt => (
                  <li
                    key={opt.id}
                    onClick={() => handleSortSelect(opt.id)}
                    style={{ color: selectedSort === opt.id ? '#309700' : '' }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
          </div>
          {/* Mobile Sort & Filter Buttons */}
            <div className="mobile-sort-filter-row">
                <button 
                  className="mobile-sort-btn"
                  onClick={() => setIsSortSheetOpen(true)}
                >
                  <i className="fas fa-sort"></i> Sort
                </button>
                <button
                    className="mobile-filter-btn"
                    onClick={() => setIsFilterSheetOpen(true)}
                >
                  <i className="fas fa-filter"></i> Filter
                </button>
            </div>

          {/* Results Grid */}
          <div className="search-cards-row">
              {searchvalue.length === 0 ? (
                 <p className='search-result-empty-error'>No Result found</p>
                 ):(
                  searchvalue.map((item)=>(
                  <Link 
                    key={item.searchId}
                    to={`/book/${item.searchId}`}
                    className="search-cards"
                  >
                      <div className="search-card-pic">
                        <img src={item.imgUrl} alt={item.name} loading="lazy" />
                      </div>
                      <div className="search-card-info">
                        <span className='search-card-field-name'>{item.name}</span>
                        <span className='search-card-field-price'>{item.price}$</span>
                      </div>
                  </Link>
                ))
              )}
          </div>
      </div>
    
      
      
      
    {/* Right - Filters (Desktop) */}
    <div className="side-card-filter">
        <div className="search-filter-container">
              <label className='search-filters-title'>Filters</label>
              <div ref={containerRef}  className="search-filter-small-container">

              {/* Format */}
              <label className='filters-label'>Format:</label>
              <select 
                value={filterFormat}
                onChange={(e)=> setFilterFormat(e.target.value)} 
                name="book-format" 
                id="book-format"
                >

                  <option value="" disabled defaultValue hidden>choose one</option>
                  {FORMAT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}

              </select>


              {/* Price Range */}
              <label className='filters-label' >Price:</label>
                  <div className="price-range-container">
                      <div className="price-range-slider-container">
                      <div
                        className="price-range-progress"
                        style={{
                          left: `calc(${progressLeft}% + ${thumbRadius}px)`,
                          width: `calc(${progressWidth}% - ${thumbRadius * 0.72}px)`,
                          transform: 'translateY(-85%)',
                        }}
                      />
                        <input
                          type="range"
                          min={minPrice}
                          max={maxPrice}
                          value={minValue}
                          onChange={handleMinChange}
                          className="price-range-slider slider-left"
                        />
                        <input
                          type="range"
                          min={minPrice}
                          max={maxPrice}
                          value={maxValue}
                          onChange={handleMaxChange}
                          className="price-range-slider slider-right"
                        />
                      </div>

                       <div className="price-range-display">
                         <span>{minValue.toLocaleString()} $</span>
                         <span>{maxValue.toLocaleString()} $</span>
                       </div>
                    </div>



              {/* Publisher */}
              <label className='filters-label' >Publisher:</label>
                  <input 
                    type="text"
                    value={filterPublisher}
                    onChange={(e) => setFilterPublisher(e.target.value)} 
                    />
              {/* Category */}
              <label className='filters-label' >Category:</label>
                  <input 
                    type="text"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    />
              {/* Author */}
              <label className='filters-label' >Author:</label>
                  <input 
                    type="text"
                    value={filterAuthor}
                    onChange={(e) => setFilterAuthor(e.target.value)}
                    />
          
              </div>
          </div>

          <button 
            onClick={handleFilterApply}
            className='search-apply-btn'
          >
            Apply
          </button>
    
    </div>
</div>

    <Footer/>

    {/* Bottom Navigation (Mobile) */}
    <div className="BottomNavbar">
          <nav className='bottom-nav'>
                <Link to="/" className="nav-item" >
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

      {/* Sort Bottom Sheet (Mobile) */}
      <div 
        className={`bottom-sheet-overlay ${isSortSheetOpen ? 'active':''}`}
        onClick={()=>setIsSortSheetOpen(false)}
      >
        <div className="bottom-sheet" onClick={(e)=>e.stopPropagation()}>
          <div className="bottom-sheet-handle"></div>
          <div className="bottom-sheet-title">Sort By</div>
          <div className="bottom-sheet-body">
          {SORT_OPTIONS.map((option)=>(
            <div
              key={option.id}
              className={`sort-option-item ${selectedSort === option.id ? 'selected':''}`}
              onClick={()=>handleSortSelect(option.id)}
            >
               <span className="sort-label">
                  {option.label}
                </span>
                <span className="check-icon">✓</span>

            </div>
          ))}
          </div>
        </div>
      </div>

      {/*  Filter Bottom Sheet (Mobile) */}
      <div className={`bottom-sheet-overlay ${isFilterSheetOpen ? 'active' : ''}`} onClick={() => setIsFilterSheetOpen(false)}>
        <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="bottom-sheet-handle"></div>
          <div className="bottom-sheet-title">Filters</div>
          <div className="bottom-sheet-body">

            {/* Format */}
            <div className="filter-group">
              <label className="filter-group-label">Format</label>
              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
              >
                <option value="">choose one</option>
                {FORMAT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group mobile-price-range">
              <label className="filter-group-label">Price</label>
              <div className="price-range-container">
                <div className="price-range-slider-container">
                  <div
                    className="price-range-progress"
                    style={{
                      left: `calc(${progressLeft2}% + ${thumbRadius2}px)`,
                      width: `calc(${progressWidth2}% - ${thumbRadius2 * 0.01}px)`,
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={minValue}
                    onChange={handleMinChange}
                    className="price-range-slider slider-left"
                  />
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={maxValue}
                    onChange={handleMaxChange}
                    className="price-range-slider slider-right"
                  />
                </div>
                <div className="price-range-display">
                  <span>{minValue.toLocaleString()} $</span>
                  <span>{maxValue.toLocaleString()} $</span>
                </div>
              </div>
            </div>

            {/* Publisher */}
            <div className="filter-group">
              <label className="filter-group-label">Publisher</label>
              <input
                type="text"
                placeholder="Enter publisher..."
                value={filterPublisher}
                onChange={(e) => setFilterPublisher(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="filter-group">
              <label className="filter-group-label">Category</label>
              <input
                type="text"
                placeholder="Enter category..."
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              />
            </div>

            {/* Author */}
            <div className="filter-group">
              <label className="filter-group-label">Author</label>
              <input
                type="text"
                placeholder="Enter author..."
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
              />
            </div>
          </div>

          {/* Apply Button */}
          <button className="bottom-sheet-apply-btn" onClick={handleFilterApply}>
            Apply Filters
          </button>
        </div>
      </div>



</div>

  )
}
