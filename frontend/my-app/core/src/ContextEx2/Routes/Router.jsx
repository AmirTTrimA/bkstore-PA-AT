// ✅
import React,{useEffect} from 'react'
import {Navigate, useLocation, Route, Routes} from 'react-router-dom'

// ---Auth Page---
import Login from '../Pages/auth/Login';
import Signup from '../Pages/auth/Signup';
import Forgetpass from '../Pages/auth/Forgetpass';
import ConfirmEmail from '../Pages/auth/ConfirmEmail';


// ---Home & Main Pages---
import Home from '../Pages/home/Home';
import Book from '../Pages/book/Book';
import Author from '../Pages/author/Author';
import Search from '../Pages/search/Search';

// ---Library Pages---
import Favorites from '../Pages/library/Favorites';
import Subscription from '../Pages/library/Subscription';
import Library from '../Pages/library/Library';

// ---Dashboard Pages---
import PDashboard from '../Pages/publisher-panel/PDashboard';
import Dashboard from "../Pages/dashboard/Dashboard"

// ---Buy Pages---
import Basket from '../Pages/buy/Basket';
import Checkout from '../Pages/buy/Checkout';

// ---Info Pages---
import AboutUs from '../Pages/info/AboutUs';
import PrivacyPolicy from '../Pages/info/PrivacyPolicy';
import Faq from '../Pages/info/Faq'
import Refund from '../Pages/info/Refund'; 

// ---Publisher Pages---
import Publisher from '../Pages/publisher/Publisher';
import AllPublisher from '../Pages/publisher/Allpublisher';

// ---Feature Components---
import ProtectedView from '../Components/feature/ProtectedView';
import PDFReader from '../Components/feature/PDFReader';
import NotFound from '../Pages/NotFound';














// ============================================
//    Scroll to Top Component
// ============================================
function ScrollToTop() {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}


// ============================================
//    Main Router
// ============================================
export default function  Router () {

     return(

        <>
          <ScrollToTop/>

          <Routes>

            {/* Redirect */}
            <Route path='/' element={<Navigate to='/home' replace/>}/>
            
            {/* Auth Routes */}
            <Route path='/login' element={<Login/>}/>
            <Route path='/signup' element={<Signup/>}/>
            <Route path='/forgetpass' element={<Forgetpass/>}/>
            <Route path='/confirmemail' element={<ConfirmEmail/>}/>

            {/* Main Routes */}
            <Route path='/home' element={<Home/>}/>
            <Route path='/book/:bookId' element={<Book/>}/>
            <Route path='/author/:authorId' element={<Author/>}/>
            <Route path='/search/:searchTerm' element={<Search/>}/>

            {/* Library Routes */}
            <Route path='/favorites' caseSensitive={false}  element={<Favorites/>}/>
            <Route path='/subscription' element={<Subscription/>}/>
            <Route path='/library' element={<Library/>}/>
            


            {/* Dashboard Routes (Protected) */}
            <Route path='/dashboard' 
              element={
                <ProtectedView >
                    <Dashboard/>
                </ProtectedView>
                      }/>

            <Route path='/pub-dashboard' 
              element={
              <ProtectedView >
                  <PDashboard/>
              </ProtectedView>
                      }/>






            {/* Buy Routes */}
            <Route path='/basket' element={<Basket/>}/>
            <Route path='/checkout' element={<Checkout/>}/>
            
            {/* Info Routes */}
            <Route path='/about-us' element={<AboutUs/>}/>
            <Route path='/privacy-policy' element={<PrivacyPolicy/>}/>
            <Route path='/faq' element={<Faq/>}/>
            <Route path='/refund' element={<Refund/>}/>

            {/* Publisher Routes */}
            <Route path='/publisher/:pubId' element={<Publisher/>}/>
            <Route path='/all-publisher' element={<AllPublisher/>}/>

            {/* Feature Routes */}
            <Route path='/pdfreader' element={<PDFReader/>}/>

            {/* 404 - Catch All */}
            <Route path='*' element={<NotFound/>}/>
            

          </Routes>   
          </>       

     )}

