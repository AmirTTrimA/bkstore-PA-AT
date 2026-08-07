// App.jsx
import React,{useEffect} from 'react';
import AuthProvider, {useAuth} from './Context/AuthContext';
import {ThemeProvider} from './Context/ThemeContext'



import { BrowserRouter} from 'react-router-dom'
import Router from './Routes/Router';



  function AppContent() {

    
    const { isLoggedIn } = useAuth();
  
    useEffect(()=>{
      console.log('Is Logged In:', isLoggedIn);
      
    },[isLoggedIn])
  

  
    return (
      <div className="app">
        <header>
          {isLoggedIn ? (
            null     
          ):(
          <div></div>
          )}
        </header>







<Router/>



        <main style={{ padding: '20px' }}>

        </main>
        {/*  [!!!!!!!fix show dark-button]  */}
        {/* {!hideDarkMode && <DarkModeToggle/>} */}
      </div>
    );
  }


  function Show(){

  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
      </AuthProvider> 
    </BrowserRouter>
  );
}





export default Show;