// ✅
import React,{useMemo} from 'react'
import Navbar from '../../Components/Navbar'
import SimpleNav from '../../Components/SimpleNav'
import { Link } from 'react-router-dom'
import "../../Styles/components/Library.css"


import { 
  pic22,pic23,pic24,
  pic25,pic5,pic6
} from '../../Constants'



// ============================================
//      Constants
// ============================================
const EXPLORE_ITEMS=[
    {id:1,imageUrl:pic22},
    {id:2,imageUrl:pic23},
    {id:3,imageUrl:pic24},
    {id:4,imageUrl:pic25},
    {id:5,imageUrl:pic5},
    {id:6,imageUrl:pic6},
]





// ============================================
//      Main
// ============================================
export default function Library() {


    // ---Memoized Data---
    const exploreItems = useMemo(() => EXPLORE_ITEMS, []);





return (
    <>
<div className="all">

    {/* Navigation */}
    <div className="full-lib-nav">
        <Navbar/>
    </div>
    <div className="lib-nav">
        <SimpleNav/>
    </div>

    {/* Main Content */}
    <div className="lib-container">
        <div className="head">
            <p className='head-txt'>Explore in Ocean</p>
        </div>
        <div className="explore">
            {exploreItems.map(ex=>{
                return (
                <Link 
                    key={ex.id}
                    to={`/book/${ex.id}`}
                    className="card-ha"
                >
                    <img src={ex.imageUrl} alt='no book'  loading='lazy' />
                </Link>
                )
            })}

        </div>
    </div>
</div>
    </>
  )
}
