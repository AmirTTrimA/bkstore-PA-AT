// ✅
import React,{useState,useEffect} from 'react'
import { useAuth } from '../../Context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ApiClient from '../../Services/ApiClient'
import "../../Styles/components/ConfirmEmail.css"







// ============================================
//    Constants
// ============================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERROR_DURATION = 2000;



// ============================================
//    Main 
// ============================================
export default function ConfirmEmail() {


    const {error,setError,clearError} = useAuth()   
    const navigate= useNavigate()
    
    
    // ---State---
    const [email,setEmail]=useState('')
    const [isLoading, setIsLoading] = useState(false);

// ---Effects---

// Auto clear error
    useEffect(()=>{
        if (error) {
          const timer = setTimeout(() => {
            clearError();
          }, ERROR_DURATION);
      
          return () => clearTimeout(timer);}
    },[error,clearError])


    // Dark mode
    useEffect(() => {
        document.body.style.backgroundColor = '#2d2d2d';
        return () => {
          document.body.style.backgroundColor = '';
          document.body.style.color = '';
        };
    }, []);
      




    // ---Handler---
    const handleSubmit = async (e)=>{
        
        
        e.preventDefault()
        setError("")
        setIsLoading(true)

        
        const trimmedEmail = email.trim();


        //email-validation
        if(!EMAIL_REGEX.test(trimmedEmail)){
          setError('Not Valid Email')
          setIsLoading(false)
          return false
        }


      try{
        const res = await ApiClient.post("/auth/request-otp",{
          email:email.trim(),
        });

        if(res.data.success){
          localStorage.setItem("resetEmail",email.trim());
          navigate('/forgetpass')
        }else{
          setError(res.data.message || "Failed to Send OTP")
        }

      }catch(err){
        if(err.response) setError(err.response?.data?.message|| "Error Send OTP")
        else setError("Server error")
      }finally{
        setIsLoading(false)
      }

    }





  return (
    <div className='confirm-container'>
      <form className="confirm-form" onSubmit={handleSubmit}>
        <h4 className='form-title'>Enter your Email </h4>
        <span className="input-span">
          <input type="email"
                 onChange={(e)=>setEmail(e.target.value)}
                 name="email"
                 placeholder='enter your email'
                 style={{textAlign:"center"}}
                 disabled={isLoading}
                 autoComplete='off'
          />
        </span>
        <button 
          type="submit"
          className="submit"
          disabled={isLoading || !email.trim()}
        >
          OK
        </button>
        {error && (
                    <div className="error-message auto-hide">
                      <i className='fas fa-exclamation-circle'></i>
                      {error}
                    </div>
                  )} 
      </form>

    </div>
  )
}
