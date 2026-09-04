
// ✅
import React, { useState,useEffect,useCallback,useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import Notification from '../../Components/feature/Notification'

import "../../Styles/components/Basket.css"

// ============================================
//    Constants
// ============================================

const VALID_DISCOUNT = {
  'SAVE10':{type:'percentage',value:20,minPurchase:50},
  'WELCOME20':{type:'fixed',value:15,minPurchase:50},
  'BOOKS25':{type:'percentage',value:25,minPurchase:40},
};





// ============================================
//    Main 
// ============================================

export default function Basket() {


// ---Hooks---
  const {isLoggedIn}=useAuth();
  const navigate = useNavigate();
  const notificationRef = useRef();




// ---State---
  const [cartItems,setCartItems] = useState([
    {id:1,name:'100-years-alive',author:'george orwell',price:25.0,quantity:1,type:'physical'},
    {id:2,name:'1984',author:'mark',price:30.6,quantity:3,type:'pdf'},
    {id:3,name:'hamilton',author:'mark-b',price:45,quantity:2,type:'pdf'},
    {id:4,name:'hosiha',author:'nn-poke',price:30.9,quantity:3,type:'pdf'},
    {id:5,name:'assassins',author:'cisso',price:40.1,quantity:4,type:'physical'},
    {id:6,name:'caraiban work',author:'daphne',price:20,quantity:10,type:'pdf'},
    {id:7,name:'art is life',author:'rose',price:10,quantity:1,type:'pdf'},
    {id:8,name:'ai station',author:'hdfljk',price:13.5,quantity:1,type:'physical'},
    
  ])


  const[discountCode,setDiscountCode]=useState('');
  const[appliedDiscount,setAppliedDiscount]=useState(null);
  const[discountStatus, setDiscountStatus] = useState(null); // 'valid', 'invalid', 'checking'
  const[hassavedaddress,setHasSavedAddress] =useState(null)



// ---Memorized Values---
  const isCartEmpty = useMemo(()=>cartItems.length === 0,[cartItems]);

  const hasphysicalbook = useMemo(()=>
    cartItems.some(item=> item.type === 'physical'),
    [cartItems]);



  const subtotal = useMemo(()=> 
    cartItems.reduce((sum,item)=> sum + (item.price * item.quantity),0),
    [cartItems])

  const discountAmount = useMemo(()=>
    appliedDiscount?.amount || 0,
    [appliedDiscount])
   const tax = (subtotal - discountAmount) * 0.1;
  const total = subtotal - discountAmount + tax;



// ---Effects---

useEffect(() => {
    const savedAddresses = JSON.parse(localStorage.getItem('user-addresses'));
    if (savedAddresses && savedAddresses.length > 0) {
      setHasSavedAddress(true);
    } else{
      setHasSavedAddress(false);
    }
  }, []);


   
// discount validation with debounce
useEffect(()=>{
  // further in api need to use await
  const validDiscount = async ()=>{
    if(!discountCode.trim()){
      setDiscountStatus(null);
      setAppliedDiscount(null)
      return
    }

    setDiscountStatus('checking');
    setTimeout(()=>{
      const code = discountCode.toUpperCase();
      const discount = VALID_DISCOUNT[code];

     
      if(discount && subtotal >= discount.minPurchase){
        let discountAmount = 0;
        if(discount.type === 'percentage'){
          discountAmount = (subtotal * discount.value) /100;
        } 
         
        else{
          discountAmount = Math.min(discount.value,subtotal);
        }
      //save applied code
        setAppliedDiscount({
          code: code,
          type: discount.type,
          value: discount.value,
          amount: discountAmount
      });
      setDiscountStatus('valid');

      }else if (discount && subtotal < discount.minPurchase){
        setAppliedDiscount(null);
        setDiscountStatus('invalid')
      }else if (!discount) {
        setAppliedDiscount(null);
        setDiscountStatus('invalid');
      }


    },500);


  };

    const timeoutId = setTimeout(validDiscount, 500);
    return () => clearTimeout(timeoutId);


},[discountCode,subtotal]);







// ---Handlers---



 


  const removeItems = useCallback((id) => {
    setCartItems(items => items.filter(item => item.id !== id));
},[])



const updateQuantity = useCallback((id, newQuantity) => {
  if (newQuantity < 1) return;
  setCartItems(items => 
      items.map(item => 
          item.id === id ? { ...item, quantity: newQuantity } : item
      )
  );
},[])


  const handleCheckerOpen = useCallback(async()=> {

        if(!isLoggedIn){
          notificationRef.current.showNotif(' required','error',{
            linkText:"login",
            linkHref:"/login"
          })
          return
        }
      
        else{
          if(hasphysicalbook){
            const hasAddress = hassavedaddress === true;

            if(!hasAddress){
              console.log('dont have add');
              navigate('/checkout',{
                state:{
                    appliedDiscount,
                    cartItems,
                    tax,
                    total,
                    subtotal,
                    discountAmount,
                    hassavedaddress:false,
                    startAtStep:1
                  }
              })
        
            }else{
              console.log('have add');
              navigate('/checkout', {
                state: {
                    appliedDiscount,
                    cartItems,
                    tax,
                    total,
                    discountAmount,
                    subtotal,
                      
                    hassavedaddress:true,
                    startAtStep: 2
                }
            });
              
            }
          }else{
            navigate('/checkout', {
              state: {
                  appliedDiscount,
                  cartItems,
                  tax,
                  total,
                  discountAmount,
                  subtotal,
                  
                  hassavedaddress:false,
                  startAtStep: 2
              }
          });
          }
  




        }





  
  },[
    appliedDiscount,navigate,subtotal,
    total,cartItems,hasphysicalbook,
    discountAmount,hassavedaddress,tax,
    isLoggedIn
    ])











  return (
    
    
  <div className="basket-container">
    {isCartEmpty ? (
      /* Empty State */
      <div className="empty-state">
        <svg className="empty-cart-icon" viewBox="0 -960 960 960">
          <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"/>
        </svg>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything to your cart yet.<br />Explore our collection and find something you love!</p>
        <button className="shop-button" onClick={()=>navigate('/home')}>Back to Shoplift</button>
      </div>
    ) : (
      /* Cart List */
      <div className="cart-list">
        <h2>Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</h2>
        
        <div className="cart-items">
          {cartItems.map(item => (
            //till 206
            <div key={item.id} className="cart-item">  
              <div className="item-info">
                <p>
                {item.type === 'physical' ? '📚 physical' : '📱 eBook'}
                </p>
                <h4>{item.name}</h4>
                <p className="item-author">by {item.author}</p>
                <p className="item-price">${item.price.toFixed(2)}</p>
              </div>
              
              <div className="container-item-actions">
                {/* till 201 */}
                <div className="item-actions">
                  <div className="quantity-control">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      −
                    
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeItems(item.id)}
                    className="remove-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                  
                </div>
                <div className="item-actions2">
                <p>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>



            </div>
          ))}
        </div>
        {/* Discount Code */}
        <div className='discount-section'>
            <div className='discount-section-inside'>
              <div className='discount-row'>
                   <label className='discount-label'>
                        Discount code
                    </label>
                    <div className='discount-input-wrapper'>
                        <input
                            type="text"
                            placeholder="Enter code "
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: `2px solid ${
                                    discountStatus === 'valid' ? '#4CAF50' :
                                    discountStatus === 'invalid' ? '#f44336' :
                                    discountStatus === 'checking' ? '#FFC107' : '#ddd'
                                }`,
                                borderRadius: '10px',
                                fontSize: '14px',
                                backgroundColor: discountStatus === 'valid' ? '#e8f5e9' :
                                              discountStatus === 'invalid' ? '#ffebee' : 'white',
                                transition: 'all 0.3s ease',
                                outline: 'none'
                            }}
                        />
                        
                        {/* Checking indicator */}
                        {discountStatus === 'checking' && (
                            <p className='discount-message-check'>
                                Checking code...
                            </p>
                        )}
                    </div>
                </div>
            </div>



            <div className='discount-summary-row'>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>


            {appliedDiscount && (
                    <div className='discount-summary-row' id='discount-applied'>
                        <p>Discount applied</p>
                        <p>-${discountAmount.toFixed(2)}</p>
                    </div>
                )}

                <div className='discount-summary-row'>
                    <span >Tax (10%):</span>
                    <span >${tax.toFixed(2)}</span>
                </div>

        </div>
        

        {/* Footer */}
        <div className="cart-footer">
              <div className="total">
                    <span>Total:</span>
                    <span className="total-amount">${total.toFixed(2)}</span>
              </div>
              <button 
                className="checkout-btn"
                onClick={handleCheckerOpen}
              >
                Checkout
              </button>
        </div>
      </div>
    )}

    <Notification ref={notificationRef}/>
  </div>

  )
}
