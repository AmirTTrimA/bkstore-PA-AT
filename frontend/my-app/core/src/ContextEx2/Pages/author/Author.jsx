// ✅
import React,{useState,useEffect} from 'react'
import SimpleNav from '../../Components/SimpleNav'
import { useNavigate, useParams } from 'react-router-dom'

// ---Styles---
import "../../Styles/components/Author.css"

import { 
  ppic3,pic4,pic8,
  pic5,pic6,pic7,
  ppic4,pic9,pic10,
  pic11,pic13,pic14
} from '../../Constants'

// ---Mock Date---
export const mockAuthor=[
{ id: 1, name: 'J.R.R. Tolkien', bio: 'Author of The Lord of the Rings. Known for his detailed world-building.', 
    profile_image:ppic3,
    books: [
        {id:1,imageUrl:pic9},
        {id:2,imageUrl:pic10}, 
        {id:3,imageUrl:pic11},
    ] 
},
{ id: 2, name: 'Jane Austen', bio: 'English novelist2 known for her six major novels, which interpret, critique and comment upon the British landed gentry at the end of the 18th century.',
        profile_image:ppic3,
        books: [
            {id:1,imageUrl:pic6},
            {id:2,imageUrl:pic7},
            {id:3,imageUrl:pic5},
            {id:4,imageUrl:pic4},
        ]
},
    
{ id: 3, name: 'George Orwell', bio: 'English novelist, essayist, journalist and critic. His work has been largely popular in the form of a wide-circulation magazine',
        profile_image:ppic4,
        books: [
            {id:4,imageUrl:pic14},
            {id:5,imageUrl:pic13},
            {id:6,imageUrl:pic8}
        ]
}

]



export default function Author() {

    const navigate=useNavigate()
    const {authorId}=useParams();

   // --State---
   const [authorData,setAuthorData]= useState(null)
   const [isLoading,setIsLoading]=useState(true);

   // ---Fetch Author Data---
   useEffect(() => {
    const foundAuthor = mockAuthor.find(author => author.id === parseInt(authorId));
    setAuthorData(foundAuthor || null);
    setIsLoading(false)

  }, [authorId]); 


// --- Loading State ---
  if(isLoading){
    return <div>loading author details</div>
  }
// --- Not Found State ---
  if (!authorData) {
    return (
        <div>
            <div>
                Author not found for ID: {authorId}
            </div>
            <div>
                Available author IDs: {mockAuthor.map(a => a.id).join(', ')}
            </div>
            <button 
                onClick={() => navigate('/home')}
            >
                Home
            </button>
        </div>
    )
  }



return (
<>
    <div className="auth-nav">
            <SimpleNav/>
    </div>

    <div className='author-container'>
        {/* Back Button */}
        <button 
            className="big-back-btn"
            onClick={()=>navigate(-1)}
        >
            <i className="fas fa-angle-left"></i>            
        </button>
        {/* Author Profile Section */}
        <div className="up-side">
            <div className="profile">
                <img 
                    src={authorData.profile_image}
                    alt="no-prof"
                    loading='lazy'
                 />
            </div>
            <div className="auth-desc">
                <span className='auth-des'>
                    <h2>{authorData.name}</h2>
                    <p>{authorData.bio}</p>
                </span>
            </div>
        </div>
        {/* Book Section */}
        <div className="down-side">
                <div className="product">
                    {authorData.books && authorData.books.length > 0 ? (
                        authorData.books.map((book)=>(
                            <div
                                key={book.id} 
                                className="auth-cards" 
                                onClick={() => {navigate(`/book/${book.id}`);
                              }}
                            >
                                <img 
                                    src={book.imageUrl}
                                    className='auth-pic'
                                    alt='no book'
                                    loading='lazy'
                                 />
                            </div>
                        ))
                    ):(
                        <p>No book found</p>
                    )}
                </div>
            </div>
    </div> 
</>
  )
}
