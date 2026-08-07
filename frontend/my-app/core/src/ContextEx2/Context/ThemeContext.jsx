// ✅
import React, { useMemo } from 'react'
import { useCallback } from 'react';
import { useState, useContext, useEffect } from 'react';



// ============================================
//      Context
// ============================================
const ThemeContext = React.createContext();

// ============================================
//      Hook
// ============================================
export const useTheme =()=>{
    // may cuse error the use simple return    
    const context = useContext(ThemeContext);
    if (!context){
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}



// ============================================
//      Provider
// ============================================
export const  ThemeProvider =({children})=> {

    // ---State---
    const[isDarkMode,setIsDarkMode]=useState(()=>{
        try{
            const saved = localStorage.getItem('darkMode')
            if(saved!== null) return saved==='true';
            // Fallback to system preference
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        } 
        catch{
            // Fallback if localStorage fails
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    });


    // ---Effects---
    useEffect(()=>{
        localStorage.setItem('darkMode',isDarkMode);
        if(isDarkMode){
            document.documentElement.classList.add('dark');
        }else{
            document.documentElement.classList.remove('dark');
        }
    },[isDarkMode])


    // ---Handlers---
    const toggle = useCallback(() =>{
         setIsDarkMode(prev=>!prev);
    },[])
    

    // ---Memorized Value---
    const value = useMemo(()=>({
        isDarkMode,
        toggle,
    }),[isDarkMode,toggle])



  return (
      <ThemeContext.Provider value={value}>
            {children}
      </ThemeContext.Provider>
  )
}
