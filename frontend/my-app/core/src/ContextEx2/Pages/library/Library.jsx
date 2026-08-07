// ✅
import React,{useMemo} from 'react'
import Navbar from '../../Components/Navbar'
import SimpleNav from '../../Components/SimpleNav'
import { Link } from 'react-router-dom'
import "../../Styles/components/Library.css"






// ============================================
//      Constants
// ============================================
const EXPLORE_ITEMS=[
    {id:1,imageUrl:'https://boom-zrbn.mohtava.cloud/thumbs/api/v1/image/90e909c8-4c7b-33e5-88aa-31147946cb87?zb_svc=fajr-im-prod&zb_dmn=ipm&zb_type=internal&zb_pl=0&zb_referer=zarebin.ir'},
    {id:2,imageUrl:'https://boom-zrbn.mohtava.cloud/thumbs/api/v1/image/d8dcf798-6f59-3792-9dcd-e7d93cebfc33?zb_svc=fajr-im-prod&zb_dmn=ipm&zb_type=internal&zb_pl=0&zb_referer=zarebin.ir'},
    {id:3,imageUrl:'https://boom-zrbn.mohtava.cloud/thumbs/api/v1/image/3d2e9dd9-708e-3214-a11a-78a78f07302d?zb_svc=fajr-im-prod&zb_dmn=ipm&zb_type=internal&zb_pl=0&zb_referer=zarebin.ir'},
    {id:4,imageUrl:'https://boom-zrbn.mohtava.cloud/thumbs/api/v1/image/bc1110ac-9c04-3d63-9ff4-f4be6f8a2af7?zb_svc=fajr-im-prod&zb_dmn=ipm&zb_type=internal&zb_pl=0&zb_referer=zarebin.ir'},
    {id:5,imageUrl:'https://boom-zrbn.mohtava.cloud/thumbs/api/v1/image/342ab0b0-f37d-3c75-9b6a-19d8287fdc89?zb_svc=fajr-im-prod&zb_dmn=ipm&zb_type=internal&zb_pl=0&zb_referer=zarebin.ir'},
    {id:6,imageUrl:'https://boom-zrbn.mohtava.cloud/thumbs/api/v1/image/1e3d85c5-367f-377f-b225-acf5cfcb2ed1?zb_svc=fajr-im-prod&zb_dmn=ipm&zb_type=internal&zb_pl=0&zb_referer=zarebin.ir'},
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
                    <img src={ex.imageUrl} alt='no book' />
                </Link>
                )
            })}

        </div>
    </div>
</div>
    </>
  )
}
