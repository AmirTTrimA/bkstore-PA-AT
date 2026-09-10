import React from 'react'
import '../Styles/components/NotFound.css'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../Context/LanguageContext'

export default function NotFound() {  
    const navigate = useNavigate();
    const { t } = useLanguage();
  
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

            <h2>{t('notFound.title')}</h2>
            <p>{t('notFound.subtitle')}</p>
            <button onClick={() => navigate('/home')} className="not-found-home-button">
               {t('notFound.backToHome')}
            </button>
        </div>
      
    </div>
  )
}

