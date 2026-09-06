import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useMediaQuery } from 'react-responsive';
import Notification from '../../Components/feature/Notification';
import '../../Styles/components/Login.css'



// ============================================
//    Constants
// ============================================
const ERROR_DURATION = 2000;



// ============================================
//    Main Components
// ============================================
export default function Login() {

  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef();

  // ---Auth Context---
  const { login, loginWithOtp, requestOtp, setError, error, clearError } = useAuth();


  // ---States---
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });

  const [loginMode, setLoginMode] = useState('password'); // 'password' | 'otp'
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1: request, 2: verify
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const digitInputRefs = useRef([]);

  const [showPassword, setShowPassword] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isCheckedRef = useRef(false);
  const labelTextRef = useRef(null);

  // ---Derived State---
  const isValid = formData.name && formData.password;
  


  // ---Effects---

  // Auto-clear error 
  useEffect(()=>{
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, ERROR_DURATION);

      return () => clearTimeout(timer);}
  },[error,clearError])






  // ---Dark Mode Effect---
  useEffect(() => {
    document.body.style.backgroundColor = '#2d2d2d';
    document.body.style.color = '#333';

    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);




  


  // Detect ?mode=otp query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'otp') {
      setLoginMode('otp');
      setIsHover(true);
    }
  }, [location.search]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ---Handlers---

  // Request OTP
  const handleRequestOtp = useCallback(async () => {
    const identifier = (otpIdentifier || formData.name).trim();
    if (!identifier) {
      notificationRef.current.showNotif('Please enter your username or email', 'error');
      return;
    }
    setOtpLoading(true);
    const res = await requestOtp(identifier);
    setOtpLoading(false);

    if (res.success) {
      setOtpStep(2);
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      notificationRef.current.showNotif('Verification code sent to your email!', 'success');
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    } else {
      notificationRef.current.showNotif(res.error || 'Failed to send OTP code', 'error');
    }
  }, [otpIdentifier, formData.name, requestOtp]);

  // Handle single digit entry in OTP boxes
  const handleDigitChange = useCallback((idx, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[idx] = clean;
      return next;
    });
    if (clean && idx < 5) {
      digitInputRefs.current[idx + 1]?.focus();
    }
  }, []);

  // Handle Backspace navigation across OTP digit boxes
  const handleDigitKeyDown = useCallback((idx, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[idx] && idx > 0) {
        digitInputRefs.current[idx - 1]?.focus();
      } else {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[idx] = '';
          return next;
        });
      }
    }
  }, [otpDigits]);

  // Handle Paste event for complete 6-digit code
  const handlePasteOtp = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = ['', '', '', '', '', ''];
      for (let i = 0; i < 6; i++) {
        next[i] = pasted[i] || '';
      }
      setOtpDigits(next);
      const targetIndex = Math.min(pasted.length, 5);
      digitInputRefs.current[targetIndex]?.focus();
    }
  }, []);

  // Verify OTP and Log In
  const handleVerifyOtp = useCallback(async (e) => {
    if (e) e.preventDefault();
    const identifier = (otpIdentifier || formData.name).trim();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      notificationRef.current.showNotif('Please enter the full 6-digit code', 'error');
      return;
    }
    setOtpLoading(true);
    const ok = await loginWithOtp(identifier, code);
    setOtpLoading(false);

    if (ok) {
      notificationRef.current.showNotif('Login success!', 'success', {
        navigateTo: '/dashboard',
      });
    } else {
      notificationRef.current.showNotif(error || 'Invalid or expired OTP code', 'error');
    }
  }, [otpIdentifier, formData.name, otpDigits, loginWithOtp, error]);

  // Standard username/password submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const usable_name = formData.name.trim();
    const usable_password = formData.password;

    const isempty = !formData.name.trim() || !formData.password 
      
    // Validation
    if(isempty){
        notificationRef.current.showNotif('fill in All field','error')
        return;
      }
      
   try{
        const isValidUser= await login(usable_name,usable_password)

        if(!isValidUser){
              notificationRef.current.showNotif('Invalid user/pass','error')
              return
            }
          
        // Success
        clearError()
        setFormData({name:'',password:''})

        notificationRef.current.showNotif('Login success!', 'success',{
          navigateTo:'/dashboard'
        });

    }
      catch(error){
        setError("Login failed4")
      }
  },[clearError, setError, login, formData])




  const handleChange=useCallback((e)=>{
    // empty error in begin
    if(error) clearError()
    const{name,value} = e.target;
    setFormData(prevstate=>(
        {...prevstate,[name]:value})
    )
    if (error){
      setError('')
    } 
},[error, clearError, setError])
  






//for Checkbox Handle(label,bool)
const handleCheckboxChange=()=>{
  isCheckedRef.current = !isCheckedRef.current;

  if (isCheckedRef.current) {
    const link = document.createElement('a');
    link.href = 'Sign-up';
    link.textContent = 'Sign up';
    link.className = 'orange-link';
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/signup');
    });

    labelTextRef.current.innerHTML = '';
    labelTextRef.current.appendChild(link);
  } else {
    // second-text(afetr one time checked)
    labelTextRef.current.textContent = 'Register';
  }
  
}




// Recognize Mouse Enter
const handleMouseEnter=useCallback(()=>{
  setIsHover(true)
  if(error) clearError()
},[error, clearError])



// Show/Hide functionality
const toggleShowPass =()=>{
  setShowPassword(!showPassword)
}




// mobile
const toggleHover = useCallback(() => {
  setIsHover(prev=>!prev);
}, []);







// hover-sensitive 
  return (
    
<>
    
  <div className={`login-container ${isHover ? 'expanded':''}`}
        onMouseEnter={!isMobile ? handleMouseEnter : undefined}
        onMouseLeave={!isMobile ? () =>setIsHover(false) : undefined}
        
    >


    <div>
        <h2 className='form-title-login' onClick={isMobile ? toggleHover : undefined}>Login</h2>
          <div className={`form-content ${isHover ?'visible':''}`}>

            {/* Mode Switcher Tabs */}
            <div className="login-mode-tabs">
              <button
                type="button"
                className={`login-tab-btn ${loginMode === 'password' ? 'active' : ''}`}
                onClick={() => {
                  setLoginMode('password');
                  if (error) clearError();
                }}
              >
                Password
              </button>
              <button
                type="button"
                className={`login-tab-btn ${loginMode === 'otp' ? 'active' : ''}`}
                onClick={() => {
                  setLoginMode('otp');
                  if (error) clearError();
                }}
              >
                OTP Code
              </button>
            </div>

            {loginMode === 'password' ? (
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  {/* Username */}
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="name"
                    required
                    className='form-fields'
                  />
                
                {/* Toggle password  */}
                  <div className="field-password">
                        <div className='toggle-btn' onClick={toggleShowPass}>
                          {showPassword?(
                                <i className='far fa-eye-slash' style={{color:'#d17842'}}></i>
                                ) : (
                                <i className='far fa-eye'></i>
                                
                          )}
                        </div>
                        <input
                            type={showPassword?'text':'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="password"
                            required
                            className='form-fields'
                            autoComplete='off'
                          />
                  </div>
                </div>
              {/* Footer Action */}
                <small>
                  <span className='register-message'> 
                      <span>
                      <span type='button'  onClick={()=> navigate('/confirmemail')}   className="forget-pass">Forget Pass</span>
                      </span> 

                   <label className="checkbox-wrapper">
                    <input type="checkbox" className="checkbox-input" onChange={handleCheckboxChange} />
                    <span className="checkbox-tile">
                      <span className="checkmark"></span>
                    </span>
                    <span
                      ref={labelTextRef}
                      className="label-text"
                    >
                      Register
                    </span>
                    
                   </label>
                   
                  </span>
                </small>
                
                {/* Submit Button */}
                <button 
                  type='submit'
                  className="form-button"
                  disabled={!isValid}
                >
                  Login
                </button>
              </form>
            ) : (
              <div className="otp-form-content">
                {otpStep === 1 ? (
                  <div>
                    <p className="otp-info-text">
                      Enter your username or email to receive a 6-digit verification code:
                    </p>
                    <div className="input-group">
                      <input
                        type="text"
                        name="otpIdentifier"
                        value={otpIdentifier}
                        onChange={(e) => {
                          setOtpIdentifier(e.target.value);
                          if (error) clearError();
                        }}
                        placeholder="Username or Email"
                        required
                        className="form-fields"
                        autoComplete="username"
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      className="form-button"
                      onClick={handleRequestOtp}
                      disabled={otpLoading || !(otpIdentifier || formData.name).trim()}
                      style={{ marginTop: 14 }}
                    >
                      {otpLoading ? "Sending Code..." : "Send Verification Code"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="otp-info-text">
                      Enter the 6-digit code sent to:<br />
                      <strong style={{ color: "#d17842" }}>{otpIdentifier || formData.name}</strong>
                    </p>
                    <div className="otp-digit-group">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (digitInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          onPaste={handlePasteOtp}
                          className="otp-digit-input"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="form-button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otpDigits.some((d) => !d)}
                    >
                      {otpLoading ? "Verifying..." : "Verify & Login"}
                    </button>
                    <div className="otp-actions-row">
                      <button
                        type="button"
                        className="otp-back-btn"
                        onClick={() => {
                          setOtpStep(1);
                          setOtpDigits(["", "", "", "", "", ""]);
                        }}
                      >
                        &#8592; Change Email
                      </button>
                      {countdown > 0 ? (
                        <span style={{ color: "#94a3b8" }}>Resend ({countdown}s)</span>
                      ) : (
                        <button
                          type="button"
                          className="otp-resend-btn"
                          onClick={handleRequestOtp}
                          disabled={otpLoading}
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
    </div>
    
  </div>
  <Notification ref={notificationRef} />
</>
  
  );
}