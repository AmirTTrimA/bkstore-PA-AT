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



  // ---Memoized Value---
  const value = useMemo(()=>({
    user,
    login,
    signup,
    logout,
    loginWithEmail,
    setError,
    error,
    clearError,
    token,
    isLoggedIn: !!token,
    updateUser:setUser,
  }),[user,error,login,logout,signup,loginWithEmail,token,
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


