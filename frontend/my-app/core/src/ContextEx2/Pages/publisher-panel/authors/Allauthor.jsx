// ✅
import React,{useState,useEffect,useRef,useMemo, useCallback} from 'react'
import Notification from '../../../Components/feature/Notification';
import "../../../Styles/publisher-panel/Allauthor.css"
// style in globals.css


// ============================================
//    Main 
// ============================================
export default function Allauthor({onEditAuthor}) {

  //---State---
  const [allauthor,setAllAuthor] = useState([]);

  //---Ref---
  const notificationRef = useRef();

  // ---Memoized Values---
  const hasAuthors = useMemo(() => allauthor.length > 0, [allauthor]);

//---Effects---

  // Load authors
  useEffect(()=>{
    const authorslist = localStorage.getItem('authors-list');
    if(authorslist){
      const availableauthors = JSON.parse(authorslist);
      setAllAuthor(availableauthors);
     } else{
      setAllAuthor([]);
     }
  
  },[])


  //---Handlers--- 
  const handleDeleteAuthors = useCallback((authorId)=>{
    const updateAuthors = allauthor.filter(author=> author.id !== authorId);
    setAllAuthor(updateAuthors);
    localStorage.setItem('authors-list',JSON.stringify(updateAuthors))
    notificationRef.current.showNotif('Author removed successfully','success');
  },[allauthor])

 const handleEditAuthors = useCallback((authorId)=>{
    if (onEditAuthor){
      onEditAuthor(authorId)
    }
  },[onEditAuthor])

     
    



 if (!hasAuthors) {
  return (
    <div className="edit-authors-container">
      <div className="all-authors-container">
        <div className="empty-authors-list">
          <p>No Author Added yet</p>
        </div>
      </div>
    </div>
  );
}

  


  return (
      <div className="all-authors-container">
        {allauthor.map(auth=>(
            <div key={auth.id} className="authors-profile">
              {/* Left Side - Action Buttons */}
              <div className="authors-profile-leftside">
                {/* Edit Button */}
                <button
                  onClick={()=>handleEditAuthors(auth)}
                  className='edit-authors-icon'
                >
                  <svg 
                    width="22px" 
                    height="22px" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    >
                      <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                      <path d="M4 20h16" />
                  </svg>
                </button>
                {/* Delete Button */}
                <button 
                  className='remove-btn'
                  onClick={()=>handleDeleteAuthors(auth.id)}
                >
                  <svg 
                    width="22"
                    height="22" 
                    viewBox="0 0 24 24" 
                    fill="none"  
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>

              {/* Right Side - Author Info */}
              <div className="authors-profile-rightside">
                <div className="authors-profile-rightside-name">
                    {auth.name}
                </div>
                {/* MAKE it better */}
                <div className="authors-profile-rightside-book-number">
                {allauthor.books?.length || 0} books |
                </div>
              </div>
            </div>           
))}
      <Notification ref={notificationRef} />
      </div>
  )
}

