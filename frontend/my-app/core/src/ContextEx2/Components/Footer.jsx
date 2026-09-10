import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../Context/LanguageContext'

// ---Style---
import '../Styles/components/Footer.css'




export default function Footer() {
  const { t } = useLanguage();
  return (

<>
    
  <footer>
    <div className='container_footer'>


      {/*  Link Section  */}
    
        <div className="container">
            <div className="footer-content">
                <div className="footer-column">
                    <h3>PageNet</h3>
                    <p>{t('info.slogan', 'Your Gateway to Infinite Knowledge & Reading')}</p>
                </div>
                <div className="footer-column">
                    <h3>{t('info.quickLinks', 'Quick Links')}</h3>
                    <ul>
                        <li><Link to="/home">{t('nav.home', 'Home')}</Link></li>
                        <li><Link to="/library">{t('nav.library', t('nav.catalog', 'Catalog'))}</Link></li>
                        <li><Link to="/subscription">{t('nav.subscription', 'Subscriptions')}</Link></li>
                        <li><Link to="/all-publisher">{t('nav.publishers', 'Publishers')}</Link></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h3>{t('info.about', 'About')}</h3>
                    <ul>
                        <li><Link to="/faq">{t('info.faq', 'Help & FAQ')}</Link></li>
                        <li><Link to="/refund">{t('info.refund', 'Refund Policy')}</Link></li>
                        <li><Link to="/about-us">{t('info.aboutUs', 'About Us')}</Link></li>
                        <li><Link to="/privacy-policy">{t('info.privacy', 'Privacy Policy')}</Link></li>
                    </ul>
                </div>
            </div>
        </div>
    
      {/* Contact Section */}
      <p className='contact-text'>{t('info.contactWithUs', 'Connect With PageNet')}</p>
        <ul className="example-link">
          {/* Telegram */}
          <li className="icon-content">
            <a
              href="https://t.me/pagenet_books"
              target="_blank"
              data-social="telegram"
              aria-label="Telegram"
              rel="noopener noreferrer"  
            >
              <div className="filled"></div>
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
                />
              </svg>
            </a>
          </li>

          {/* Bale (بله) */}
          <li className="icon-content">
            <a
              href="https://ble.ir/pagenet_books"
              target="_blank"
              data-social="bale"
              aria-label="Bale Messenger"
              rel="noopener noreferrer"  
            >
              <div className="filled"></div>
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12c0 1.84.5 3.56 1.37 5.04L2.5 21.5l4.58-.85C8.52 21.47 10.2 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.12 7.72l-4.7 6.1a.998.998 0 01-.8.38.998.998 0 01-.78-.36l-2.42-2.52a1.002 1.002 0 011.45-1.38l1.64 1.71 3.96-5.14a1.003 1.003 0 011.65 1.21z"
                />
              </svg>
            </a>
          </li>

          {/* Aparat (آپارات) */}
          <li className="icon-content">
            <a
              href="https://www.aparat.com/pagenet_books"
              target="_blank"
              data-social="aparat"
              aria-label="Aparat"
              rel="noopener noreferrer"  
            >
              <div className="filled"></div>
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3.2 5.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm6.4 0a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm-6.4 6.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm6.4 0a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"
                />
              </svg>
            </a>
          </li>
        </ul>

        <div className="copyright">
            <p>&copy; 2025 PageNet. {t('info.allRightsReserved', 'All rights reserved.')}</p>
        </div>
    </div>
  </footer>


</>
  )
}
