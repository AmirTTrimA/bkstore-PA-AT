// ✅
import React, { useRef,useEffect,useState,useCallback } from 'react'
import { useAuth } from '../../Context/AuthContext';
import {useNavigate } from 'react-router-dom';
import ApiClient from "../../Services/ApiClient" 

import '../../Styles/components/Forgetpass.css'




// ============================================
//    Constants
// ============================================
const OTP_LENGTH = 4;
const ERROR_DURATION = 2000;


// ============================================
//     Main 
// ============================================
export default function Forgetpass() {
    
  
    const {loginWithEmail} = useAuth()
    const navigate = useNavigate()
    const inputsRef = useRef([])

    // ---State---
    const[error,setError]=useState("")
    const[isLoading,setIsLoading]=useState(false)

    

// ---Effects---

  //Auto-clear error 
  useEffect(()=>{
    if (error) {
      const timer = setTimeout(() => {
        setError('')
      }, ERROR_DURATION);
      return () => clearTimeout(timer);}
  },[error])




// ---Handlers---
    const handleChange = (e, index) => {
      
      const value = e.target.value;
       // Only allow numbers
      if (value && !/^\d$/.test(value)) {
        e.target.value = ''
        return
      }
       // Move to next input if value exists
      if(value && index < inputsRef.current.length -1){
        inputsRef.current[index+1].focus()
      }
    }


    const handleKeyDown=(e,index)=>{

      // Move to previous input on backspace
      if(e.key ==='Backspace' && !e.target.value && index>0){
        inputsRef.current[index-1].focus()
      }
    }


    // copy-paste option
    const handlePaste = useCallback((e) => {
      const paste = e.clipboardData.getData("text").trim();
      if (/^\d+$/.test(paste)) {
        paste.split("").forEach((char, i) => {
          if (inputsRef.current[i]) {
            inputsRef.current[i].value = char;
          }
        });
        const nextIndex = Math.min(paste.length, inputsRef.current.length - 1);
        inputsRef.current[nextIndex].focus();
      }
    },[])
  


    const handleVerify = useCallback(async() => {
      const code = inputsRef.current.map((input) => input.value).join("");
      
      // Validate OTP length
      if (code.length !== OTP_LENGTH) {
        setError(`Please enter all ${OTP_LENGTH} digits`);
        return;
      }

      setIsLoading(true);
      setError('');

      try{
        const {data} = await ApiClient.post("/auth/verify-otp",{
          email:localStorage.getItem("resetEmail"),
          otp:code,
        });

        
        // save token and login
        localStorage.setItem("token",data.token)
        loginWithEmail(data.token)
        navigate('/dashboard')


      }catch(err){
        if(err.response){
          setError(err.response.data.message || "Incorrect code");
        }else{
          setError("Server error")
        } 
      }finally{
        setIsLoading(false)
      }
      
    },[navigate,loginWithEmail])
  



    // clear-entered-pass
    const handleClear = () => {
      inputsRef.current.forEach((input) => (input.value = ""));
      inputsRef.current[0].focus();
    };





  return (
<div className='form-container' >
  <form 
      className="form"
      onPaste={handlePaste}
      onSubmit={(e) => e.preventDefault()}
  >
      {/* Close Button */}
      <button 
          type="button"
          className="close"
          onClick={()=>navigate('/login')}
      >
          X
      </button>

      {/* Header */}
      <div className="forget-info">
          <span className="title">Two-Factor Verification</span>
          <p className="forget-description">
            Enter the 4-digit code we send to your account.
          </p>
      </div>

    {/* OTP inputs */}
    <div className="input-fields">
          {[0,1,2,3].map((_, index) => (
            <input
              key={index}
              type="tel"
              maxLength="1"
              ref={(el) => (inputsRef.current[index] = el)}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={isLoading}
            />
          ))}
    </div>

    {/* Error Message */}
    {error && (
        <div className="error-message auto-hide">
          <i className='fas fa-exclamation-circle'></i>
          {error}
        </div>
    )} 

    {/* Action Buttons */}
    <div className="action-btns">
          <button 
            type="submit"
            onClick={handleVerify}
            className="verify"
            disabled={isLoading}
          >
            Verify
          </button>
          
          <button 
            type="button"
            onClick={handleClear}
            className="clear"
            disabled={isLoading}
          >
            Clear
          </button>

    </div>
  </form>
</div>
  )
}
