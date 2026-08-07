
// ✅
import { useState,useEffect,useRef,useCallback,useMemo } from 'react';
import { Navigate,useLocation } from 'react-router-dom';
import { Modal, Box, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import Notification from '../../Components/feature/Notification'
import iranData from "../../../iranData.json";
import "../../Styles/components/Checkout.css"



// ============================================
//      Constants
// ============================================
const PHONE_REGEX = /^09\d{9}$/;  // start 09 and have 9 more num
const POSTCODE_REGEX = /^\d{10}$/;



// ============================================
//      Main 
// ============================================
export default function Checkout() {
    
    const location = useLocation();
    const notificationRef= useRef();
    


    // ---State from Location---
    const { 
        cartItems, 
        appliedDiscount, 
        discountAmount, 
        tax, 
        total,
        
        hassavedaddress,
        startAtStep
    } = location.state || {}; 




    // ---Derived State---
    const hasPhysicalBooks = useMemo(()=> 
        cartItems?.some(item => item.type === 'physical') || false,
        [cartItems]);


    



        // ---State---
        const [step, setStep] = useState(1); // 1=info, 2=payment, 3=confirm
        const [shippingInfo, setShippingInfo] = useState({
            receivername:'',
            phone:'',
            address:'',
            postcode:'',
    
            province:'',
            city:'',
            platenum:'',
            
        });

        const [cardInfo, setCardInfo] = useState({
              number: '',
              password:'',
              expiry: '',
              cvv: ''
        });
        const [errors, setErrors] = useState({
            province:"",
            city:"",
            address: "",
        
            receivername:"",
            phone:"",
            
            platenum:"",
            postcode: "",
        
          });

        const [provinces, setProvinces] = useState([]);
        const [cities, setCities] = useState([]);
        const [selectedProvince, setSelectedProvince] = useState(null);
        const [selectedCity, setSelectedCity] = useState(null);
        
        const [orderId,setOrderId]= useState('');
        const [generatedPassword, setGeneratedPassword] = useState('');
        const [validpass, setValidPass] = useState(false);

        const [savedAddList,setSavedAddList] = useState([]);
        const [selectedAddress,setSelectedAddress] = useState(null);
        const [addressModalOpen,setAddressModalOpen] = useState(false);
        const [tempSelectedAddressId, setTempSelectedAddressId] = useState(null);
       

        const isLoadingEdit = useRef(false);
    


        const getInitialStep = useCallback(() => { 
            if (startAtStep) return startAtStep;
            if (!hasPhysicalBooks) return 2;
            if (hasPhysicalBooks && hassavedaddress) return 2;
            if (hasPhysicalBooks && !hassavedaddress) return 1;
            // Default
            return 1;
         },[hasPhysicalBooks,hassavedaddress,startAtStep])
        


// ---Effects---
    
// Load Provience
useEffect(() => {
        setProvinces(iranData.provinces);
      }, []);


// Handle Provience Selection
useEffect(() => {
    if (selectedProvince) {
      const provinceCities = iranData.cities[selectedProvince.id] || [];
      setCities(provinceCities.map(cityName => ({ 
        id: `${selectedProvince.id}-${cityName}`, 
        name: cityName 
      })));

      setShippingInfo(prev=>({
        ...prev,
        province: selectedProvince.name
          }));
    
        if(!isLoadingEdit.current){
    
        setSelectedCity(null);
        setShippingInfo(prev => ({
          ...prev,
          city: ''
        }));
  
        }
    
        } else {
          setCities([]);
          if(!isLoadingEdit.current){
          setSelectedCity(null);
          setShippingInfo(prev=>({
            ...prev,
            city:''
          }));
    
        }
      }
        
      }, [selectedProvince]);
    
    
// Handle City Selection
useEffect(() => {
    if (selectedCity) {
      setShippingInfo(prev => ({ 
        ...prev, 
        city: selectedCity.name 
      }));

      setErrors(prev=>{
          if(prev.city){
           return { ...prev, city:''}
          }
          return prev;
        })

      } else {
        setShippingInfo(prev => ({ 
          ...prev, 
          city: "" 
        }));
      }
    }, [selectedCity]);
    
    

// Dark mode
useEffect(() => {
     document.body.style.backgroundColor = '#2d2d2d';
     document.body.style.color = '#333';
 
     const random = Math.random().toString(36).substr(2,10).toUpperCase();
     setOrderId(random);
 
 
     return () => {
       document.body.style.backgroundColor = '';
       document.body.style.color = '';
     };
   }, []);




// Load saved addresses
useEffect(()=>{
    const savedAddresses = JSON.parse(localStorage.getItem('user-addresses'));

    if (savedAddresses && savedAddresses.length > 0 && hasPhysicalBooks) {
        setSavedAddList(savedAddresses);
      }
    

    const initialStep = getInitialStep();
    setStep(initialStep);

  },[getInitialStep,hasPhysicalBooks])

// Handle Address Modal
useEffect(()=>{
    if(step === 2 && savedAddList.length > 0 && !selectedAddress){
        setAddressModalOpen(true)
    }
  },[step,savedAddList,selectedAddress]);





  
// ---Helper Functions---
    const Validations = useCallback(()=> {
              
              let isValid = true;
              const newErrors = {
                  province:'',
                  city:'',
                  address:'',
                  
                  receivername:'',
                  phone:'',
                  
                  platenum:'',
                  postcode:'',
        
              };
        
              if (!shippingInfo.province || shippingInfo.province.trim() === '') {
                newErrors.province = 'province is required';
                isValid = false;
              }
        
              if (!shippingInfo.city || shippingInfo.city.trim() === '') {
                newErrors.city = 'city is required';
                isValid = false;
              }
        
              if(!shippingInfo.receivername || shippingInfo.receivername.trim() === ''){
                newErrors.receivername = 'receivername required';
                isValid=false;
              }else if(shippingInfo.receivername.trim().length < 3){
                newErrors.receivername = 'receivername must be at least 3 character';
                isValid=false;
              }
        
        
        
              // basic-address-validation
                if (!shippingInfo.address || shippingInfo.address.trim() === '') {
                  newErrors.address = 'address is required';
                  isValid = false;
                } else if (shippingInfo.address.trim().length < 5) {
                  newErrors.address = 'address must be at least 5 characters';
                  isValid = false;
                }  
        
        
        
                // platenum-validation
                if(!shippingInfo.platenum || shippingInfo.platenum.trim() === ''){
                  newErrors.platenum = 'platenum required';
                  isValid = false;
                }else if(shippingInfo.platenum <=0){
                  newErrors.platenum = 'platenum cant be 0 or less ';
                  isValid = false;
                }
        
        
        
                
                // post-code-validation
                if(!shippingInfo.postcode || shippingInfo.postcode.trim() === ''){
                  newErrors.postcode = 'post-code required';
                  isValid = false;
                }else if(!POSTCODE_REGEX.test(shippingInfo.postcode)){
                  newErrors.postcode = 'post-code is 10 number ';
                  isValid = false;
                }
        
        
             
        
                // phone-validations
                if(!shippingInfo.phone || shippingInfo.phone.trim() === ''){
                  newErrors.phone = 'phone required';
                  isValid = false;
                } else if(!PHONE_REGEX.test(shippingInfo.phone) ){
                  newErrors.phone = 'phone contain 11 digits (start with 09)';
                  isValid = false;
                }
        
                setErrors(newErrors);
                return isValid;
        
        
        
        
    },[shippingInfo])
        


    const saveToLS = () =>{
        const existingAdd = JSON.parse(localStorage.getItem('user-addresses')|| []);

        const newAdd ={
            id: Date.now(), // Unique ID
            receivername: shippingInfo.receivername,
            phone: shippingInfo.phone,
            address: shippingInfo.address,
            postcode: shippingInfo.postcode,
            province: shippingInfo.province,
            city: shippingInfo.city,
            platenum: shippingInfo.platenum,
            createdAt: new Date().toISOString()
        }


        const addressExists = existingAdd.some(addr=>
            addr.address === shippingInfo.address &&
            addr.postcode === shippingInfo.postcode 
            );


        if (!addressExists){
            existingAdd.push(newAdd);
            localStorage.setItem('user-addresses', JSON.stringify(existingAdd));
        }

        return newAdd


}





    // ---Handlers---
    const handleChange =(e)=>{

        const { name , value } = e.target;


        if(name==='province'){
            const province = provinces.find(p => p.name === value);
            setSelectedProvince(province);
            setShippingInfo({...shippingInfo, province: value});


        }else if(name==='city'){
            const city = cities.find(c => c.name === value);
            setSelectedCity(city);
            setShippingInfo({...shippingInfo, city: value});
        }else{
            setShippingInfo({...shippingInfo,[name]:value});
        }


        
        if (errors[name]) {
          setErrors({...errors,[name]: ''});
        }
      }
    

      const handlecontinueToStep2 =()=>{
        if(Validations()){
            saveToLS();
            notificationRef.current.showNotif("Address saved",'success')

            setStep(2);
        }else{
            notificationRef.current.showNotif('Please fix the errors above', 'error');
        }
    }














        


    
    

    const passfilled = cardInfo.password.length === 6;

    

    const handlepass =()=>{
        const randpass = Math.floor(Math.random()* 1000000).toString().padStart(6,'0');
        setGeneratedPassword(randpass)
        notificationRef.current.showNotif(`${randpass} is send to you`,'info');
    }




    const handlePlaceOrder = () => {
            
            if(cardInfo.password === generatedPassword){
                notificationRef.current.showNotif('Buy successfully!', 'success');
                setValidPass(true);
        }
            else{
            setValidPass(false);
            notificationRef.current.showNotif('Invalid password. Please try again.', 'error');
            return false;   
        }

    };
    

        
    







    const handleConfirmAddressSelect = ()=>{
        const selected = savedAddList.find(addr=> addr.id === tempSelectedAddressId );

        if(selected){
            setSelectedAddress(selected);
            setShippingInfo({
                province: selected.province || '',
                city: selected.city || '',
                receivername: selected.receivername || '',
                address: selected.address || '',
                phone: selected.phone || '',
                postcode: selected.postcode || '',
                platenum: selected.platenum || '',
            })
            setAddressModalOpen(false);
            notificationRef.current.showNotif('Address selected','success');
        }else{
            notificationRef.current.showNotif('Select an address', 'error');
        }



    }





  // ---Redirect if no items---
  if (!cartItems || cartItems.length === 0) {
    return <Navigate to="/basket" />;
}




    return (
        <div className="checkout-form">
            <Notification ref={notificationRef}/>
            
            {/* Address Selection Modal */}
            <Modal
                open={addressModalOpen}
                onClose={()=>{
                        if(!selectedAddress){
                            notificationRef.current.showNotif('Select a shipping address', 'error');
                            return;
                        }
                        setAddressModalOpen(false);
                        }}
                disableEscapeKeyDown={!selectedAddress}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%',
                            maxWidth: '500px',
                            bgcolor: 'background.paper',
                            boxShadow: 24,
                            borderRadius: 2,
                            p: 3
                        }}
                    >

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <h2 className='checkout-modal-title'>Select Shipping Address</h2>
                                {selectedAddress && (
                                    <IconButton onClick={() => setAddressModalOpen(false)} size="small">
                                        <CloseIcon />
                                    </IconButton>
                                )}
                        </Box>

                        <p className='checkout-modal-text'>
                            Please select your shipping address to continue
                        </p>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Your Saved Addresses</InputLabel>
                        <Select
                            value={tempSelectedAddressId || ''}
                            onChange={(e) => setTempSelectedAddressId(e.target.value)}
                            label="Your Saved Addresses"
                        >
                            {savedAddList.map((address) => (
                                <MenuItem key={address.id} value={address.id}>
                                    <div>
                                        <strong>{address.receivername}</strong>
                                        <div className='checkout-modal-field' >
                                             {address.city}, {address.province}
                                        </div>
                                        <div  className='checkout-modal-field' >
                                            {address.address}
                                        </div>
                                        <div  className='checkout-modal-field' >
                                             {address.phone} |  {address.postcode}
                                        </div>
                                    </div>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <button 
                            onClick={handleConfirmAddressSelect}
                            disabled={!tempSelectedAddressId}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: tempSelectedAddressId ? '#4caf50' : '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: tempSelectedAddressId ? 'pointer' : 'not-allowed',
                                width: '100%'
                            }}
                        >
                            Confirm Selection
                        </button>
                    </Box>


                    </Box>
            </Modal>







            
   
            {/* Step1: Display saved address if it exists (from profile) */}       
            {step === 1 && (
                <div className="step1">
                    <h2 className='title-checkout'>Checkout</h2>
                    <p>Provide your shipping address</p>


                   
                    
                        
                    <select 
                        name='province'
                        className={`checkout-field ${errors.province ? 'error': ' '}`}
                        value={shippingInfo.province}
                        onChange={handleChange}
                        required
                    >
                       <option value="" >select province</option>
                            {provinces.map((province)=>(
                                <option key={province.id} value={province.name}>
                                    {province.name}
                                </option>
                       ))}
                    </select>
                    {errors.province && <span className="error-text">{errors.province}</span>}


                    <select
                        name='city'
                        className={`checkout-field ${errors.city ? 'error':''}`}
                        value={shippingInfo.city}
                        onChange={handleChange}
                        disabled={!selectedProvince}
                        required
                    >
                        <option value="" >select city</option>
                            {cities.map((city)=>(
                                <option key={city.id} value={city.name}>
                                    {city.name}
                                </option>
                       ))}

                    </select>
                    {errors.city && <span className="error-text">{errors.city}</span>}



                    <input 
                        name='receivername'
                        className={`checkout-field ${errors.receivername ? 'error' : ''}`}
                        placeholder="Receiver Name"
                        value={shippingInfo.receivername}
                        onChange={handleChange}
                        required
                    />
                    {errors.receivername && <span className="error-text">{errors.receivername}</span>}


                    <input 
                        name='phone'
                        className={`checkout-field ${errors.phone ? 'error' : ''}`}
                        placeholder="Phone Number (09XXXXXXXXX)"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={handleChange}
                        required
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}


                <div className="address-container">
                    <textarea
                        name='address'
                        className={`checkout-address ${errors.address ? 'error' : ''}`}
                        placeholder="Address"
                        value={shippingInfo.address}
                        onChange={handleChange}
                        rows={3}
                        required
                    />
                    {errors.address && <span className="error-text">{errors.address}</span>}
                </div>

        
                    <input 
                        name='platenum'
                        type='number'
                        className={`checkout-field ${errors.platenum ? 'error' : ''}`}
                        placeholder="Plate Number"
                        value={shippingInfo.platenum}
                        onChange={handleChange}
                        required
                    />
                    {errors.platenum && <span className="error-text">{errors.platenum}</span>}
                                

                    <input 
                        name='postcode'
                        type='number'
                        className={`checkout-field ${errors.postcode ? 'error' : ''}`}
                        placeholder="ZIP / Postal Code (10 digits)"
                        value={shippingInfo.postcode}
                        onChange={handleChange}
                        required
                    />
                    {errors.postcode && <span className="error-text">{errors.postcode}</span>}   
                    



                    
                    <button 
                    onClick={handlecontinueToStep2}
                    className='checkout-continue-btn'
                    >
                        Continue
                    </button>





                    
                </div>
            )}






            {/* Step2: order-summary (last check) */}
            {step === 2 && (
                <div className="step2">
                    <h2 className='title-checkout-summary'>Order Summary</h2>
                    
                    
                    <div className="summary">
                    {cartItems.map((item, idx) => (
                        <div key={idx}>
                            {item.quantity} X {item.name} = ${(item.price * item.quantity).toFixed(2)}
                        </div>
                    ))}


                        {hasPhysicalBooks && 
                        <>
                            <h3>Shipping to:</h3>
                            <p>{shippingInfo.address}</p>
                            <p>postal: {shippingInfo.postcode}</p>
                        </>
                        }
                        

                        {appliedDiscount &&
                            <span>discount :-${discountAmount.toFixed(2)}</span>      
                        }
                        
                        
                        <p>TotalTax: ${tax?.toFixed(2)}</p>
                        <h3>Total: ${total.toFixed(2)}</h3>
                        <hr />
                        <h3 className='orderId-text'>OrderId: {orderId}</h3>
                        

                    </div>
                    
                   
                    <div className="button-group-summary">
                        {savedAddList.length > 0 && selectedAddress && (
                                <button 
                                    onClick={() => setAddressModalOpen(true)}
                                >
                                  Change
                                </button>
                        )}

                        <button 
                            onClick={()=>setStep(3)}
                            disabled={savedAddList.length > 0 && !selectedAddress} 
                        >
                             Order
                        </button>
                    </div>
                </div>
            )}




            {/* Step 3: Payment */}
            {step === 3 && (
                <div className="step3">
                    <h2 className='title-checkout'>Checkout</h2>
                    <p>Payment Method</p>

                            <input 
                                className='pay-card'
                                placeholder="Card Number"
                                value={cardInfo.number}
                                onChange={e => setCardInfo({...cardInfo, number: e.target.value})}
                            />
                            
                            <div className="detail-card-info">
                                <input 
                                placeholder="MM/YY"
                                value={cardInfo.expiry}
                                onChange={e => setCardInfo({...cardInfo, expiry: e.target.value})}
                                />
                                <input 
                                placeholder="CVV" 
                                type="text"
                                value={cardInfo.cvv}
                                onChange={e => setCardInfo({...cardInfo, cvv: e.target.value})}
                                />

                            </div>
                            <input 
                                className='pay-card'
                                placeholder="password"
                                type="password"
                                value={cardInfo.password}
                                onChange={e => setCardInfo({...cardInfo, password: e.target.value})}
                            />
                        
                    
                    <div className="button-group">
                    <button onClick={() => setStep(2)}>Back to Order detail</button>
                        <button 
                            onClick={handlePlaceOrder}
                            disabled={!passfilled}
                            value={validpass}
                            className="continue-btn"
                            style={{
                                opacity: !passfilled ? 0.5 : 1,
                                cursor: !passfilled ? 'not-allowed' : 'pointer'
                            }}
                            >
                                Pay
                            </button>
                        <button onClick={handlepass}>send pass</button>  
                    </div>
                </div>
            )}
        </div>
    );
}