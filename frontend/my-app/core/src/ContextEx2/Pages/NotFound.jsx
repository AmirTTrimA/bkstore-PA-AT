// ✅
import React from 'react'
import '../Styles/components/NotFound.css'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {  
    const navigate = useNavigate();
  
  
    return (
    <div className='not-found-container'>
        <div className="not-found-content">
          {/* Tv Animation */}
            <div className="tv-container">
              <div className="tv-screen">
                <div className="not-found-static"></div>
                <div className="not-found-error-text">ERROR</div>
              </div>
              <div className="tv-stand"></div>
            </div>

            <h2>Locked in Books </h2>
            <p>Oops! The page not found</p>
            <button onClick={() => navigate('/home')} className="not-found-home-button">
               Back to Home
            </button>
        </div>
      
    </div>
  )
}

