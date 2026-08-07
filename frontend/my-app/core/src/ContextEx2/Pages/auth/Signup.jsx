// ✅
import React from 'react'
import { useState,useRef,useEffect } from 'react';
import { Link } from 'react-router-dom';
import {useAuth} from '../../Context/AuthContext'
import Notification from '../../Components/feature/Notification';
import '../../Styles/components/Signup.css'
import { useCallback } from 'react';


// ============================================
//    Constants
// ============================================
const MIN_AGE = 13;
const MAX_AGE = 120;
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_PATTERNS = [
  /[a-z]/, 
  /[A-Z]/, 
  /[0-9]/, 
  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 
];
const ALL_CHARS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};




// ============================================
//    Main Component
// ============================================
export default function Signup() {


  const { signup,setError,error,clearError } = useAuth();
  const notificationRef = useRef(null);

  // ---State---
  const[signData,setSignData]=useState({
    name:'',
    age:'',
    email:'',
    password:'',
    password2:''
})


const [strength, setStrength] = useState('none');
const [isLampOn, setIsLampOn] = useState(false);


const isValid = signData.name &&
                signData.age &&
                signData.email &&
                signData.password &&
                signData.password2 



const getStrengthColor =()=>{
  switch(strength){
    case 'weak': return '#ff4757';
    case 'medium': return '#ffea02';
    case 'strong': return '#2ed573';
    default: return '#ccc';
  }
}




// ---Effects---

 // Auto-clear error after duration
      useEffect(() => {
        if (error) {
          const timer = setTimeout(clearError, 2000);
          return () => clearTimeout(timer);
        }
      }, [error, clearError]);


      // ---Password Strength Checker---
      useEffect(()=>{

        const checkStrength = (pass)=>{
          if(!pass || pass.length === 0) return 'none';
            
          
          
          let score = PASSWORD_PATTERNS.reduce((count, pattern) => 
            count + (pattern.test(pass) ? 1 : 0), 0
          );
    
          // Length bonus
          if (pass.length >= MIN_PASSWORD_LENGTH) score++;
  
          
          if (score<=2) return 'weak';
          if (score<=4) return 'medium';
          if (score>=5) return 'strong';
          
        }
    
    
        setStrength(checkStrength(signData.password))
      
      },[signData.password])
      
    
      // Dark mode Effect
      useEffect(() => {
        document.body.style.backgroundColor = '#2d2d2d';
        document.body.style.color = '#333';
        return () => {
          document.body.style.backgroundColor = '';
          document.body.style.color = '';
        };
      }, []);



// ---Helper Functions---

const validateAge = useCallback((birthdate)=>{

  if (!birthdate) {
    notificationRef.current.showNotif('Birthdate is required', 'error');
    return false;
  }
  
  const birthDate = new Date(birthdate);
  const today = new Date();

  if (isNaN(birthDate.getTime())) {
    notificationRef.current.showNotif('Please enter a valid birthdate', 'error');
    return false;
  }
  if (birthDate > today) {
    notificationRef.current.showNotif('Birthdate cannot be in the future', 'error');
    return false;
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if(age< MIN_AGE || age> MAX_AGE){
    notificationRef.current.showNotif(`Age range is ${MIN_AGE}-${MAX_AGE} `,'error')
    return false;
  }
  

  return age;


},[]);

const SignupValidation = useCallback((name,age,email,password) => {

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

    // emptiness check
    if (!trimmedName || !age || !trimmedEmail || !password) {
      notificationRef.current.showNotif('All fields are required','error');
      return false;
    }

   

    const ageResult = validateAge(age);
    if(ageResult === false){
      return false;
    }



    // email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
      notificationRef.current.showNotif('Enter Valid-email','error')
      return false;
    }


    // password Validation
    if(password.length < MIN_PASSWORD_LENGTH){
      notificationRef.current.showNotif('Password not Strong (8)','error')
      return false;
    }





    return ageResult;
  },[validateAge])






  // ---Handlers
  const handleChange = useCallback((e) => {
    if(error) clearError()
      const{name,value} = e.target;
      setSignData(prevstate=>(
          {...prevstate,[name]:value})
      )
      if (error){
        setError('')
      } 
  },[error,setError,clearError])
  
  
  

  const handlesubmit = useCallback(async (e) => {
    e.preventDefault();
    clearError();

    if (signData.password !== signData.password2) {
      notificationRef.current.showNotif('Password not match', 'error');
      return;
    }

    const ageResult =SignupValidation(
        signData.name,
        signData.age,
        signData.email,
        signData.password) 

      if (ageResult === false){
        return ;
      }

  

    const success = await signup(
      signData.name.trim().toLowerCase(),
      ageResult,
      signData.email.trim(),
      signData.password,
      signData.password2
    );
  

    if (success) {
      setSignData({ name:"", age:"", email:"", password:"", password2:"" });
      notificationRef.current.showNotif('Signup success!', 'success',{
        navigateTo:'/login'
      });

    
      console.log("Signup successful");
    }
    else{
      notificationRef.current.showNotif('Signup failed! try later', 'error');

    }


    },[signup,SignupValidation,clearError,signData])


// Turn on/off lamp 
const toggleLamp = ()=>{
  setIsLampOn(!isLampOn)
}


// suggest pass
const SuggestPass = ()=>{
    
  const { lowercase, uppercase, numbers, symbols } = ALL_CHARS;

    const allchars = lowercase + uppercase + numbers + symbols
    let newPassword =''

    // Least one each type
    newPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    newPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    newPassword += numbers[Math.floor(Math.random() * numbers.length)];
    newPassword += symbols[Math.floor(Math.random() * symbols.length)];

    // 4 rest randomly
    for ( let i=4 ; i < 8; i++ ){
      newPassword += allchars[Math.floor(Math.random() * allchars.length)]
    }

    // Shuffle 
    newPassword = newPassword.split('').sort(()=> Math.random()-0.5).join('');

    setSignData(prev=>({...prev,password:newPassword}))

  }


  return (

<div className="signup-content">
      <form className='signup-form'>
        <h2 className='title-signup'>Signup</h2>
        <div className="field">

          {/* Name */}
          <i className='far fa-id-card' id='icons'></i>
          <input 
            type="text"
            className='signup-form-fields'
            name='name'
            placeholder='name'
            value={signData.name}
            onChange={handleChange}
            autoComplete="off"
            required
            />
        </div>

        {/* Age */}
        <div className="field">
          <i className='fas fa-calendar-alt' id='icons'></i>
          <input 
            type="date"
            className='signup-form-fields'
            id='age-date'
            name='age'
            placeholder='age'
            value={signData.age}
            onChange={handleChange}
            autoComplete="off"
            required
            />
        </div>

        {/* Email */}
        <div className="field">
          <i className='fas fa-at' id='icons'></i>
          <input 
            type="text"
            className='signup-form-fields'
            name='email'
            placeholder='email'
            value={signData.email}
            onChange={handleChange}
            autoComplete="off"
            required
            />
        </div>

        {/* Password */}
        <div className="field">  
          <i className='fas fa-fingerprint' id='icons'></i>    
          <input 
            type="text"
            className='signup-form-fields'
            name='password'
            placeholder='password'
            value={signData.password}
            onChange={handleChange}
            autoComplete="off"
            required
            onFocus={() => setIsLampOn(true)}
            />

      
      
      {/* Strength Indicator & Lamp */}       
        <div  
          className={`lampSection ${isLampOn ? 'alwaysVisible' : ''}`}
          title="suggest strong pass"
        >
           <div className='lampContainer'>

            <button 
              className={`lampButton ${isLampOn ? 'lampOn' : ''}`}
              onClick={()=>{
                  toggleLamp();
                  SuggestPass();
              }}

              onMouseEnter={(e) => {
                if (isLampOn) {
                  e.target.style.boxShadow = '0 0 50px 5px rgba(255, 255, 150, 0.5), 0 4px 20px rgba(0,0,0,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (isLampOn) {
                  e.target.style.boxShadow = 'none';
                }
              }}
            >

              {/* Lamp icon */}
              <div className='lampIcon'>
                {isLampOn
                ? <i className='far fa-lightbulb' ></i>
                :<i className='fas fa-lightbulb' ></i>
                }
              </div>
              
              
            </button>
              
            {/* Indicator */}
            <div
                className={`strengthIndicator ${
                  strength === 'weak'
                    ? 'weak'
                    : strength === 'medium'
                    ? 'medium'
                    : strength === 'strong'
                    ? 'strong'
                    : ''
                }`}
                style={{
                  backgroundColor: getStrengthColor()
                }}
            >
            </div>
        </div>
            
          
          
          </div>            
        </div>

        {/* Confim Pass */}
        <div className="field">
          <i className='fas fa-fingerprint' id='icons'></i>
          <input 
            type="text"
            className='signup-form-fields'
            name='password2'
            placeholder='repeat-password'
            onChange={handleChange}
            autoComplete="off"
            value={signData.password2}
            required
            />
        </div>
        
        {/* Back to Login */}
        <div className="return-login">  
            <nav>
              <p>back to <Link to='/login' className='return-login-link'>login</Link></p>
            </nav>
        </div>
        
        
        




        {/* Submit Button*/}
        <button 
          type='submit'
          className='form-buttons'
          onClick={handlesubmit}
          disabled={!isValid}
        >
          Confirm!
        </button>

      </form>

      <Notification ref={notificationRef}/>
    
</div>   
  )
}
