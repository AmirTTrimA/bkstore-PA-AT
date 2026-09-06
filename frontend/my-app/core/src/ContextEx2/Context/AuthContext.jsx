// ✅
import React, { createContext, useContext, useState , useRef , useMemo,useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import AuthService from '../Services/AuthService'
import Notification from '../Components/feature/Notification';

// ============================================
//    Context
// ============================================
const AuthContext = createContext();



// ============================================x
//    Provider Component
// ============================================
export default function AuthProvider({ children }){
  
  const navigate = useNavigate()
  const notificationRef = useRef(null);

  // ---State---
  const [user, setUser] = useState(() => {
    try{
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch{
        return null;
    }
  });


  const [token,setToken] = useState(
    localStorage.getItem('token')|| null
  ) 
  const [error,setError] = useState('')
  

  //---Helper Func---
  const clearError=()=>{setError('')}



  //---Auth Functions--- 


  // Login with username/password
  const login = useCallback(
    async(name,password) => {
    try {
      
      const res = await AuthService.login({
        username: name.trim().toLowerCase(),
        password,
      });

      const accessToken = res.data.access;
      const refreshToken = res.data.refresh;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
 
      const userData = { username: name };
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);

      return true;

    }catch(err){
      setError(err.response?.data?.message || "Login failed. try again");
      return false;
    }
  },[]);




  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    notificationRef.current.showNotif('logout from account!','warning')
  }, []);





  // Signup
  const signup = useCallback(
  async (name, age, email, password,password2) => {
    try {
      await AuthService.register({
        username: name.trim().toLowerCase(),
        age,
        email: email.trim(),
        password,
        password2
      });



      
      return true;
    } catch (err) {
        setError(err.response?.data?.message || "Signup failed");
        return false;
    }

  },[]);


  // Login with email (magic link)
  const loginWithEmail = useCallback(
    async(email)=>{
      try{
      const res = await AuthService.loginWithEmail({email});

      const accessToken = res.data?.accessToken;
      const userData = res.data?.user;


      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      setUser(userData);

      navigate('/dashboard')
      return true

    }catch(err){
      setError("Invalid Email")
      return false
    }

    
      
  },[navigate]) 



  // Request OTP code
  const requestOtp = useCallback(
    async (identifier) => {
      try {
        const res = await AuthService.requestOtp({
          username_or_email: identifier.trim(),
        });
        clearError();
        return { success: true, detail: res.data?.detail };
      } catch (err) {
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.username_or_email?.[0] ||
          "Failed to request OTP code.";
        setError(msg);
        return { success: false, error: msg };
      }
    },
    []
  );

  // Login with OTP
  const loginWithOtp = useCallback(
    async (identifier, code) => {
      try {
        const res = await AuthService.loginWithOtp({
          username_or_email: identifier.trim(),
          code: code.trim(),
        });

        const accessToken = res.data?.access_token || res.data?.access;
        const refreshToken = res.data?.refresh_token || res.data?.refresh;

        if (!accessToken) {
          setError("No access token returned from server.");
          return false;
        }

        localStorage.setItem("token", accessToken);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        const userData = { username: identifier.trim() };
        localStorage.setItem("user", JSON.stringify(userData));

        setToken(accessToken);
        setUser(userData);
        clearError();
        return true;
      } catch (err) {
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.code?.[0] ||
          err.response?.data?.message ||
          "Invalid or expired OTP code.";
        setError(msg);
        return false;
      }
    },
    []
  );

  // ---Memoized Value---
  const value = useMemo(()=>({
    user,
    login,
    loginWithOtp,
    requestOtp,
    signup,
    logout,
    loginWithEmail,
    setError,
    error,
    clearError,
    token,
    isLoggedIn: !!token,
    updateUser:setUser,
  }),[user,error,login,loginWithOtp,requestOtp,logout,signup,loginWithEmail,token,
  ]) 

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Notification ref={notificationRef} />
    </AuthContext.Provider>
    
  );
};

// ============================================
//    Hook
// ============================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


