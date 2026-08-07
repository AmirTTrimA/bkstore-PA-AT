// ✅
import React, { useState,useEffect,useMemo,useCallback } from 'react'
import SimpleNav from '../../Components/SimpleNav'
import { useNavigate } from 'react-router-dom'
import DeleteIcon from '@mui/icons-material/Delete';

import "../../Styles/components/Favorites.css"

// ============================================
//      Main Component
// ============================================
export default function Favorites() {

    const navigate = useNavigate()


    // ---State---
    const [favItems,setFavItems] = useState([]);


    // ---Derived State---
    const isEmpty = useMemo(() => favItems.length === 0, [favItems]);
    

    



    // ---Handlers---
    const loadFav = useCallback(()=>{
        try{
            const favorite = JSON.parse(localStorage.getItem('favorite')||'[]');
            setFavItems(favorite);
        }
        catch(error){
            setFavItems([]);
        }
    },[])

    const clearFav = useCallback(()=>{
        try{
            localStorage.setItem('favorite',JSON.stringify([]));
            setFavItems([])
        }
        catch(error){
            console.error('Failed to clear favorites:', error);
        }
        
    },[])




    // ---Effects---
    useEffect(()=>{
        loadFav();
    },[loadFav])



  return (
    <>
        
        <div className="fav-nav">
            <SimpleNav/>
        </div>
    <div className="fav-container">
        {/* Header */}
        <div className="fav-nav-head">
            <button onClick={()=>navigate(-1)} className="big-back-btn" id='back2' >
                <i className="fas fa-angle-left"></i>     
            </button>
            <p className='titler'>mylist</p>
        </div>

            {/* Clear Button */}
            {!isEmpty &&(
                <button 
                onClick={() => clearFav()}
                className="remove-fav-btn"
            >
                <DeleteIcon sx={{width:29 , height:29}}/>
            </button>
            )}
            

            {/* Content */}
            {isEmpty ? (
                    <div className="empty-favorites">
                            <p>Empty favorites</p>
                            <button onClick={() => navigate('/library')} className="browse-btn">
                                Back to Library 
                            </button>
                    </div>
            ):(
            <div className="cards-row">
                {favItems.map(item=>{
                       return <a href={`/book/${item.id}`} key={item.id} className="fav-cards">
                            <div className="card-pic">
                                <img src={item.imageUrl} alt={item.name} />
                            </div>
                            <span className='card-title'>{item.name}</span>
                        </a>
          
            })}
        </div>
        
            )}
    </div>

    
    </>
  )
}
