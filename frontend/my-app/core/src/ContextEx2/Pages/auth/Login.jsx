// ✅
import React, { useState,useEffect,useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
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
  const notificationRef = useRef();

  // ---Auth Context---
  const { login,setError,error,clearError} = useAuth();


  // ---States---
  const[formData,setFormData]=useState({
    name:'',
    password:''
})

  const[showPassword,setShowPassword]=useState(false)
  const[isHover,setIsHover]=useState(false)
  const isCheckedRef = useRef(false)
  const labelTextRef = useRef(null)

  // ---Derived State---
  const isValidD= formData.name && formData.password
  


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




  


  // ---Handlers---
  const handleSubmit = useCallback(async(e) => {


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












// hover-sensitive 
  return (
    
<>
    
  <div className={`login-container ${isHover ? 'expanded':''}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={()=>setIsHover(false)}>


    <div>
        <h2 className='form-title-login'>Login</h2>
          <div className={`form-content ${isHover ?'visible':''}`}>

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
                  disabled={!isValidD}
                >
                  Login
                </button>
              </form>
          </div>
    </div>
    
  </div>
  <Notification ref={notificationRef} />
</>
  
  );
}