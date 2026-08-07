// ✅
import React,{useMemo,useCallback} from 'react'
import SimpleNav from '../../Components/SimpleNav'
import { useNavigate } from 'react-router-dom'
import "../../Styles/components/Subscription.css"





// ============================================
//      Constants
// ============================================
const SUB_OPTIONS=[
    {
        id:1,
        title:'1 month',
        price:"100$",
        description:'1 month access,show all product to user '
    },
    {
        id:2,
        title:'3 month',
        price:"200$",
        description:'3 month access,show all product to user,chat with authors '
    },
    {
        id:3,
        title:'6 month',
        price:"300$",
        description:'6 month access,1 month gift,show all product to user,chat with authors '
    },
]



// ============================================
//      Main
// ============================================
export default function Subscription() {
    const navigate = useNavigate();

 
  // ---Memoized Data---
  const options = useMemo(() => SUB_OPTIONS, []);

  const handleBuySubscription = useCallback((optionId) => {
    console.log(`Buying subscription: ${optionId}`);
    // Navigate to checkout or show modal
  }, []);

    return (
    <>
      <div className="sub-nav">
        <SimpleNav/>
      </div>

      <div className="sub-container">
        {/* Back Button */}
        <button 
            className="big-back-btn"
            onClick={()=>navigate(-1)}
        >
            <i className="fas fa-angle-left"></i>            
        </button>

        {/* Title */}
        <div className="title-container">
            <h2 className='sub-title'>Subscription</h2>
        </div>


            {/* Cards */}
            <div className="cards-container">
                {options.map(op=>{
                    return (
                    <div  
                        key={op.id}
                        className="card"
                        id={`op-${op.id}`}
                    >
                        <div className="card-top">
                            <h4 className='sub-title2'>{op.title}</h4>
                            <p className='description'>{op.description}</p>
                        </div>
                        
                            <p className='sub-price'>{op.price}</p>
                            <button 
                                className='sub-buy-btn'
                                onClick={()=>handleBuySubscription(options.id)}
                            >
                                Buy
                            </button>
                        
                    </div>)
                })}
            </div>

        
      </div>
    </>
  )
}
