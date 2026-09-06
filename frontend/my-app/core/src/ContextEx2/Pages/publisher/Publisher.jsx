// ✅
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate,useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Button,
  Box,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import SimpleNav from '../../Components/SimpleNav';
import Footer from '../../Components/Footer';
import ReusableSlider from '../../Components/common/ReusableSlider';
import ReusableSliderPortrait from '../../Components/common/ReusableSliderPortrait';


import { allPublishers } from './Allpublisher';

import "../../Styles/components/Publisher.css"
import { 
  pic10, pic11,pic12,
  pic13, pic14, pic15,
  pic3, pic9, port1, port2, ppic1,
  ppic11, ppic12, ppic3,
  ppic5, ppic8
} from '../../Constants';

// ============================================
//    Constants
// ============================================
const SAVE_PORTRAIT =port2
const SAVE_PORTRAIT2 =port1

const CONTENT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Egestas purus viverra accumsan in nisl nisi. Arcu cursus vitae congue mauris rhoncus aenean vel elit scelerisque. In egestas erat imperdiet sed euismod nisi porta lorem mollis. Morbi tristique senectus et netus. Mattis pellentesque id nibh tortor id aliquet lectus proin. Sapien faucibus et molestie ac feugiat sed lectus vestibulum. Ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget. Dictum varius duis at consectetur lorem. Nisi vitae suscipit tellus mauris a diam maecenas sed enim. Velit ut tortor pretium viverra suspendisse potenti nullam. Et molestie ac feugiat sed lectus. Non nisi est sit amet facilisis magna. Dignissim diam quis enim lobortis scelerisque fermentum. Odio ut enim blandit volutpat maecenas volutpat. Ornare lectus sit amet est placerat in egestas erat. Nisi vitae suscipit tellus mauris a diam maecenas sed. Placerat duis ultricies lacus sed turpis tincidunt id aliquet. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Egestas purus viverra accumsan in nisl nisi. Arcu cursus vitae congue mauris rhoncus aenean vel elit scelerisque. In egestas erat imperdiet sed euismod nisi porta lorem mollis. Morbi tristique senectus et netus. Mattis pellentesque id nibh tortor id aliquet lectus proin. Sapien faucibus et molestie ac feugiat sed lectus vestibulum. Ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget. Dictum varius duis at consectetur lorem. Nisi vitae suscipit tellus mauris a diam maecenas sed enim. Velit ut tortor pretium viverra suspendisse potenti nullam. Et molestie ac feugiat sed lectus. Non nisi est sit amet facilisis magna. Dignissim diam quis enim lobortis scelerisque fermentum. Odio ut enim blandit volutpat maecenas volutpat. Ornare lectus sit amet est placerat in egestas erat. Nisi vitae suscipit tellus mauris a diam maecenas sed. Placerat duis ultricies lacus sed turpis tincidunt id aliquet.`;


// ============================================
//    Mock Data
// ============================================
const slider_items_same_vibe = [
  { id:1, title: "jules and nothing",
    price: "400,000 IRR",link: "2",authorId:1,
    img:pic14,author_profile:ppic12
  },
  { id:2, title: "harry potter",
    price: "500,000 IRR",link:"3",authorId:3,
    img: pic15,author_profile:ppic3
  },
  { id:3, title: "operation os",
    price: "300,000 IRR",link:"7",authorId:2,
    img: pic10,author_profile:ppic1
  },
  { id:4, title: "dsa", 
    price: "250,000 IRR",link: "6",authorId:1,
    img:pic9,author_profile:ppic8
  },
  { id:5, title: "gfsd",
    price: "600,000 IRR",link: "5",authorId:3,
    img:pic10,author_profile:ppic5
  },
  { id:6, title: "dsafa",
    price: "200,000 IRR",link: "4",authorId:2,
    img:pic15,author_profile:ppic3
  },
  { id:7, title: "dada",
    price: "550,000 IRR",link: "1",authorId:2,
    img:pic13,author_profile:ppic11
},
];


const slider_items_same_vibe3 = [


{ id:1, title: "operation os",
  price: "300,000 IRR",link:"2",
  authorId:1,img: pic3
},
{ id:2, title: "dsa",
  price: "250,000 IRR",link: "3",
  authorId:2,img:pic11
},
{ id:3, title: "gfsd",
  price: "600,000 IRR",link: "5",
  authorId:3,img:pic12
},
{ id:4, title: "dsafa",
 price: "200,000 IRR",link: "6",
 authorId:3,img:pic13
}

];


// ============================================
//    Main
// ============================================
export default function Publisher() {


  const navigate = useNavigate();
  const {pubId}=useParams();
  
  
  
  // ---State---
  const [publisher,setPublisher] = useState(null);
  const [expanded, setExpanded] = useState(false);
  

  // ---Memoized Data---
  const sliderItems = useMemo(() => slider_items_same_vibe, []);
  const sliderItems3 = useMemo(() => slider_items_same_vibe3, []);


  // ---Effects---
  useEffect(() => {
      
    // Simulate fetch book 
    const foundPublisher = allPublishers.find(p => p.id === parseInt(pubId));
    
    if (foundPublisher) {
      setPublisher(foundPublisher || '')
    } else {
      setPublisher(null); 
    }

  }, [pubId]);





// ---Loading State---
  if (!publisher) {
    return <div>Loading publisher information...</div>;
  }





  return (
    <div>

      <div className="search-nav-res">
        <SimpleNav/>
      </div>

    <div className="publisher-container">
          
    {/* Back Button  */}
    <button 
      onClick={()=>navigate(-1)}
      className="big-back-btn"
    >
      <i className="fas fa-angle-left"></i>            
    </button>

    {/* Publisher Bio */}
    <div className="publisher-bio-container">
            <div className="publisher-bio">
                <span>20 author</span>
                <img src={publisher.imgUrl} alt={publisher.name}  loading='lazy' />
                <span>30 book</span>
            </div>

            <div className="publisher-name">
                <span >{publisher.name}</span>
            </div>
    </div>


    {/* Expandable Content */}
    <div className="publisher-data-show">
    <Box sx={{ maxWidth: 650, margin:'0 auto',
      '@media (max-width:600px)':{
              padding:'0 20px',
            }
     }}>
      <motion.div
        style={{
          overflow: 'hidden',
          position: 'relative'
        }}
        animate={{
          maxHeight: expanded ? 500 : 100
        }}
        transition={{ duration: 0.3 }}
      >
        <Typography sx={{ whiteSpace: 'pre-wrap',
          '@media (max-width: 600px)': {
                  padding: '15px',  
                } 
      }}>
          {CONTENT}
        </Typography>
        
        <AnimatePresence>
          {!expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50px',
                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.5))',
                pointerEvents: 'none'
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
          <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  mb: 2
                }}>
                    <Button
                      onClick={() => setExpanded(!expanded)}
                      startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ mt: 2,p:2,justifyContent: 'center', }}
                      variant="outlined"
                      color="primary"
                    >
                      {expanded ? 'Show Less' : 'Show More'}
                    </Button>

          </Box>
    </Box>
    </div>

    {/* Sliders */}
    <div className="publisher-work">

    <ReusableSlider
        items={sliderItems}
        title="Genius Author"
        viewAllLink="/categories"
        customClass="publisher-author"
        />
    <ReusableSlider
        items={sliderItems}
        title="Most Offer"
        viewAllLink="/categories"
        customClass="publisher-offer"
        />


    <ReusableSliderPortrait
        items={sliderItems3}
        title="Famous Book"
        viewAllLink="/categories"
        customClass="publisher-famous2"
        portrait={SAVE_PORTRAIT}
        />


    <ReusableSlider
        items={sliderItems}
        title="Best E-book"
        viewAllLink="/categories"
        customClass="publisher-ebook"
        />
    <ReusableSlider
        items={sliderItems}
        title="Top Sell"
        viewAllLink="/categories"
        customClass="publisher-sell"
        />


    <ReusableSliderPortrait
        items={sliderItems3}
        title="New Book"
        viewAllLink="/categories"
        customClass="publisher-new2"
        portrait={SAVE_PORTRAIT2}
        />

        
                               

    </div>


    <Footer/>


    </div>



    </div>
  )
}
