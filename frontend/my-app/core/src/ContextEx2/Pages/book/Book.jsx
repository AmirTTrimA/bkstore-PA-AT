// ✅
import React ,{ useState,useRef,useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from "framer-motion";
import { containerVariants,cardVariants } from '../../../animations';


// ---Components---
import Footer from '../../Components/Footer';
import ReusableSlider from '../../Components/common/ReusableSlider';
import SimpleNav from '../../Components/SimpleNav';
import { useAuth } from '../../Context/AuthContext';
// ---Styles---
import "../../Styles/components/Book.css"
import {mockAuthor} from '../author/Author'




import Notification from '../../Components/feature/Notification';
import Navbar from '../../Components/Navbar';

import { pic1,pic2,pic3,pic4,pic5,ppic1,c1,c2,c3,c4 } from '../../Constants';

// ---MockData---
export const mockBook=[
{id:1,name:'100-days-Alive',format:'pdf',pd_price:'20$',ph_price:'35$',category:['education'],authorId:3,
  comments:[
    {
        username:'amin',
        content:'absolutely masterpiece from master orwell'
    },
    {
        username:'mohanna',
        content:'really boring '
    },
    {
        username:'reza',
        content:'not bad at all '
    },
    {
        username:'sheida',
        content:'really except more from orwell'
    },


    ],
  imageUrl:pic1
},
{id:2,name:'quran',format:'physical',pd_price:'10$',ph_price:'15$',category:['religious'],authorId:2,
  comments:[
    {
        username:'hesam',
        content:'good guideness from quran'
    },
    {
        username:'zahra',
        content:'me and my family still use it since 2 years ago'
    },
    {
        username:'zeinab',
        content:'recently buy it nice till now '
    },
    {
        username:'ali',
        content:' i bought it for my son very important as parent effect'
    },


  ],
  imageUrl:"https://boom-zrbn.mohtava.cloud/mdmk8_1w96pNrIiN6rV3XA/4764998504/system/resources/previews/059/339/900/large_2x/holy-quran-book-image-gold-decorated-islamic-scripture-photo.jpg?zb_svc=fajr-im-prod&zb_dmn=static.vecteezy.com&zb_scm=https&zb_pl=0&zb_referer=zarebin.ir"
},
{id:3,name:'1944',format:'pdf',pd_price:'30$',ph_price:'25$',category:['history'],authorId:3,
  comments:[
    {
        username:'tina',
        content:'absolutely masterpiece from master orwell'
    },
    {
        username:'mohsen',
        content:'really boring '
    },
    {
        username:'ahmad',
        content:'not bad at all '
    },
    {
        username:'moretza',
        content:'really except more from orwell'
    },


  ],
  imageUrl:pic4
},
{id:4,name:'eslam',format:'pdf',pd_price:'15$',ph_price:'10$',category:['religious'],authorId:2,
  comments:[
    {
        username:'parsa',
        content:'absolutely masterpiece from master orwell'
    },
    {
        username:'parviz',
        content:'really boring '
    },
    {
        username:'sohrab',
        content:'not bad at all '
    },
    {
        username:'tiam',
        content:'really except more from orwell'
    },


  ],
  imageUrl: pic5
},
{id:5,name:'eslam2',format:'physical',pd_price:'10$',ph_price:'11$',category:['religious','education'],authorId:1,
  comments:[
    {
        username:'iman',
        content:'absolutely masterpiece from master orwell'
    },
    {
        username:'mahdi',
        content:'really boring '
    },
    {
        username:'navid',
        content:'not bad at all '
    },
    {
        username:'alireza',
        content:'really except more from orwell'
    },


  ],
  imageUrl:pic5
},
 ]

//  ---Constants---
const MOBILE_BREAKPOINT = 768;

// ============================================
//    Main Components
// ============================================
export default function Book() {


  // ---Hooks---
  const {bookId}=useParams();
  const {isLoggedIn}=useAuth();
  const navigate=useNavigate();
  const notificationRef = useRef(null);

  
  //  ---State---
  const [book,setBook]= useState(null)
  const[liked,setLiked]=useState(false);
  const[commentlike,setCommentLike]=useState(0);
  const[commentdislike,setCommentDislike]=useState(0);
  const [commenttext,setCommentText]=useState("");
  const[format,setFormat]=useState('')
  const[price,setPrice]=useState('')
  const priceref=useRef('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);    //Responsive
  const [showallcomments,setShowAllComments]=useState(false);

  

    


   
// ---Effects---

// 1-handle window resize for mobile
    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);



// 2-fetch book (later replace with api)
  useEffect(() => {
      
    const foundBook = mockBook.find(b => b.id === parseInt(bookId));
    
    if (foundBook) {
      const author = mockAuthor.find(a => String(a.id) === String(foundBook.authorId));
      setBook({ ...foundBook, author: author }); // Attach author object to book
    } else {
      setBook(null); 
    }

  }, [bookId]);

  
// 3-check if book is in favorites
  useEffect(()=>{
    if(book){
      
      const savedFavs = localStorage.getItem('favorite');
      let favorite = [];
    
      if (savedFavs) {
        favorite = JSON.parse(savedFavs);
      }
    
      if (!Array.isArray(favorite)) {
        favorite = [];
      }
    
    
      const isfavorited = favorite.some(fav=> fav.id === book.id)
      setLiked(isfavorited)
    }
  },[book])






// ---Derived State---
    const commentsToShow = showallcomments 
      ? book?.comments 
      : book?.comments.slice(0,3);

    const isButtonDisabled =  !commenttext?.trim();



// ---Handlers---
    const handleFormatChange =(e)=>{
      const selectedformat = e.target.value;
      setFormat(selectedformat);
      
      // let price="";
      
      // if(selectedformat === 'physical'){
      //   price = book.ph_price;
      // }else if(selectedformat === 'pdf'){
      //   price = book.pd_price;
      // }
      
      // setPrice(price);

      setPrice(
        selectedformat === 'physical'? book?.ph_price:
        selectedformat === 'pdf'? book?.pd_price:
        ''
      )
      
    }


    // Navigation
    const handleAuthor = () => {
      if (book && book.author && book.author.id) {
        navigate(`/author/${book.author.id}`); 
      } else {
        console.warn("Author ID not found for navigation.");
      }
    };



    // Comments
    const handlecomment = ()=>{
      if(!isLoggedIn){
        notificationRef.current.showNotif(' require','error',{
          linkText:"login",
          linkHref:"/login"
        })
        return 
      }
      

      console.log('posted');
      setCommentText('')
    }




    // Like / Favorite
    const handleLike = ()=>{
      if(!isLoggedIn){
        notificationRef.current.showNotif(' required','error'
        ,{
          linkText:'login',
          linkHref:'/login'
        })
        return
      }

      let favorite = []
      const savedFav  = localStorage.getItem('favorite');

      if(savedFav){
        favorite  = JSON.parse(savedFav);
      }

      if (!Array.isArray(favorite)) {
        favorite = [];
      }


      if(!liked){
        const newFav = {
            id:book.id,
            name:book.name,
            imageUrl: book.imageUrl,
            author: book.author?.name,
            category: book.category
        }

        favorite.push(newFav);
        
        localStorage.setItem('favorite',JSON.stringify(favorite));
        setLiked(true);
        notificationRef.current.showNotif('Added to favorite','success');
      }
      else{
        const updatedfavorites = favorite.filter(fav => fav.id !== book.id);
        localStorage.setItem('favorite', JSON.stringify(updatedfavorites));
        setLiked(false);
        notificationRef.current.showNotif('Removed from favorites', 'warning');
      }


      
    }






  // Category
    const handleCategory=(category)=>{
    navigate(`/search/${encodeURIComponent(category)}`);
  }



  
  // CommentLike
    const handleCommentLike=()=>{
      setCommentLike(p=>p+1);
    }
    const handleCommentDislike=()=>{
      setCommentDislike(p=>p+1);
    }















// ---MockDataSliders---
    const slider_items_same_author = [
      { title: "jules and nothing", price: "40$",link: 1,authorId:1,author_profile:'https://boom-zrbn.mohtava.cloud/uorIcYhNBnUsDWFImr0Z5g/4764998504/files/1404/04/28/44.jpg?zb_svc=fajr-im-prod&zb_dmn=setare.com&zb_scm=https&zb_pl=0&zb_referer=zarebin.ir', img:pic1},
      { title: "harry potter", price: "50$",link:2,authorId:2,author_profile:ppic1, img:pic2},
      { title: "operation os", price: "30$",link:3,authorId:3, img:pic3 },
      { title: "dsa", price: "25$",link: '4',authorId:2, img:"data:image/jpeg;base64,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" },
      { title: "gfsd", price: "60$",link: '5',authorId:3,img:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/  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" },
      { title: "dsafa", price: "20$",link: '6',authorId:1,img:"data:image/jpeg;base64,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" },
];
    const slider_items_same_vibe = [
      { title: "jules and nothing", price: "40$",link: "1",authorId:1
      ,img:"data:image/jpeg;base64,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"
      ,author_profile:"data:image/png;base64,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"
      },
      { title: "harry potter", price: "50$",link:"2",authorId:2
      ,img: pic2
      ,author_profile:ppic1
      },
      { title: "operation os", price: "30$",link:'3',authorId:3
      ,img: pic3
      },
      { title: "dsa", price: "25$",link:'4',authorId:2
      ,img:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMSEhUTExMWFhUXFx0aGBcWGBgaGxoYHRgYGh0YGx8fHSggGholHRcXITEhJSkrLi4uGB8zODMtNygtLisBCgoKDg0OGxAQGzAlICUvMC0uLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0uLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKgBLAMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAIFBgABB//EAEkQAAEDAgMEBwUGBAMGBQUAAAECAxEAIQQSMQVBUWEGEyJxgZGhMkKxwdEUUnLh8PEjU2KCFjNDFZKissLSBySDk+JUY3PD0//EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EAC4RAAICAQMEAQIGAgMBAAAAAAABAhEDEiExBBNBUSIyYRRCUnGhsZHhgaLBBf/aAAwDAQACEQMRAD8AyPTJIQ2ynLBIzE8TJ14XV3mk14hZwzCRZKHCCqJ9sTpvIClfWodIMR1qkqmcyZJNyTMW8ABRELAZUhWocSrW8RCh6CuODWhWbNq2NYjaCAgpZzSJuvVf9Riwgiya7pEcy2XDBztJk+8ewJzc+YpAYlMpyJBISQQu3G4uNARztVjtQF1vBgKSAGss3MFIvJ7xHlSVJ3+407TNb0HxoWhSQCYN1HjeExGn5UljtofacUoAhIDYJzaSSkwrhaR4c6D0FfDWGfWV6EwN0xbXfNZJjaZ/jwAOtF9bdsKt4gVnHHqk6K1bItWtppbx7jgkpBXGUkWykJVPdHfV1tbaiAApJzLKIF4SDrm48LcjWFQ4QokHUa+FWSn0gCSAqE35SZiNVaW5Gtp41szPUWuzNprdILyt49uZNoHhcd1qrNq4lIchuAJzXM5FSb390xzEHvoz7pQ2EkDNmzWvYwqCbHh30niEJUcg0nMkDUIVCik290kgd86VGy3JbdH1HozhQnqlLVJKUHXVXVkzXzN/ai0Yh5bXZU4pUqyglMqkEA2CgRflX1DYpEAGxCbAbgGt363V812XgC4s9oKJcUJUkGU2USU6lRzCL8bixEQSTdlztpUVONClOhSkEFaUxJmQAEZ5jeUKrW4nZpXhm41KpzDeoAyABYXmItMW4ZzaTmZ9QBK4ORM3JSDAnifj3zW5QUDBoUq4Ai1yBNymTuuvS+UnhTytqhQXJjdvQfdCYAzAbrC4E3TBChvuaZWShlDYKc3VdqYUFZiCAg6TEG1/GibbbLjjSCRmJSCrQEKNnO4iZ4GeVWG18K202kFYTCiIjMswIGTMkDJBAmYkVSlskVGO7Z3RIqVhn79rrGxlPvZ5SZnzqGzkdR9oUZOHbAJEwVOaBIOt50ofRN11H2hLaUmUE3M3g5dJBVwiq7FqzJKZV1alZgV654AMxYix3b6HG5NBstzU7KwC8Rh87kddiDlTJUQhoGSYBkJEEDU+dY/azKEYl1CZypkJKgRI0Bg7uFarobtkSFLIkN5BCJCW0z6Tc8SSaz+2HA/iXFmE9kbuYtO/W1VjTTaCVNFt0IwQdUpJPZNjugkWUDxgEEd3Ka9TaVYhxChAzryjcN6VHiALxbnAmrjoctTOdRGqbDTcVBXPWwjfVZth1DOKzNqDpFiIiTp2v6rm2lh3Vnb1sdfFD2ExHWtt6qKQqbgmAZJhVikTMWtIgJmKvbqRnzpjKoA2vcHSDeLAxzI3VD7aGyUtoUEGUyV5hJHZUCkdlQB3TwO+vFfxDlMg5Se8gfl5mriqdkN7UCwSiQQkDQ3EWTeTe5tI5zFMbLZzO5VJns6ExexseIBn8po+wcOXFkCUgiSNx3fOZ+tXbOz0ErbS7ERnN8wX3jQGscuZRbQoqweFaLu6AJBgSUgXE8okTeToQYAaxDCYDq1BLYGVNzJMZSSSTJidO1dUWprZgCG1JUlKQoe+QVGIHatJBO4j4xQcU6h3rGgJjKFAgiLEiwgcDqndOlcjnbs0tUe4TZbzLLJaAX1kJzZbSVEgkQSEARJiBfeZF7iej/UFAbSleayk5DkJ35ozKM8VTzNU2H2u8211TbwBSk37ISgCLaE62PxrQbK6WdcgDsFYmcpMEfeuBb0rphoabSdkVbK/bixh3QsqCExC0IQVFE3IhKgJgiDc+9WN230kcTnS24oNulKlGe0AB7JINjAvAGt5rWPbIQpSnCpK7So2lZuJibxMftVF0qwC+pbGHYPt9oESozYdw+GtOMnqKcdjBqSk390G5kmfQXq6RjmfsqEuhQJKsgbCSQJnMST3DcdaUx2zFtIh1spWDOXdEkBRvpYwaawewmiySvM25AiTIVJkWibpIrok4tIlJrgtcbtBpTwWyhyEoBCic4ye2rrM0kEyRHC1pgVuFxxeWEhlEAkqCTlII3lShE6gd5p5GwkhaozFEDsGVXiQbEZo1i+ppl9hxCUFxbbLYEKEqHZBPYHtJJg6J4muDJli9luN2KY1xKJUhaZCUmG5IEyRJFyZjWLxzqnZxqEpAC3FcTpckmPaE99Wm1GsMFAJ7ZISAlJNxcxMEEghIiJvSadmpXKkO66gBXZOuUmLkSLitMUbj5E7Kd0EFMAeHKK51d1a91RfeTYAXGpqIWB2gTMXk+groX3MQcRePGr7Z7hcbbBiGg4oCYtdc23iCBPKs/l0HKnW3MoROgJBixIm/oauStFx2HlPq7Uq7K7xNjfTX48Kq2RBVzHzFROKJMHQHceG8DuqbCkhSwmSADBiDupxTiDYIpuRV+gIThluQguZ20pJiQkpVmj0rPhJBMxRGUFYJmACkHkDp8KuW4KW5d4vOq4gwN5sREkSeUmkGGgULczwoADhMwCB8a8G1FZMukbxvNx8CR405sxSVPNggFKROXQzqZ8QKxk3FBds2nS1w4YQlRSoaFO8x8Kz/RvHdqSUiHARaJJTkudPPzo/StwK6wyTKgRMzeeJsPpVIwyoIcASSMwJV4AgcAZonFVuU5b7BdpMLOKUVCCSN0dxNhrxrWrSF4VQRYwDlJEkggnQWVIBgWBtuNZJLylYpsq1CU6EqBygwZnXurdu4dP2btkSADI3SYnnqJ4yrnWWR/SVDyZ7Y2CS/nX/AC0goIsMwv4C2nPhFH6TpSptBVkSciStarlSjKkpTEzcqkxab070awjKW1yCFKIClEwAAZkRcA6Gi9JMMEuBTa0pUW8l+yEN5TBOoKlGYPIU7qRpHeJnNhYQ9asTkTBUoSFXSAYkWOs17itguIYUtZhKEZhbeYsP1xpjo/s4OFakrUjKRkUoHtEpVvHdFMbfxSlYZYCgpJTB1sEnurVtqWxkyXQrAo6tDkSuIg6a6RvmReqnb2zFYfEKSU+0nMBJNrxw0jfWgTiC0wzEDK2i4tBCb3G+qXaeMLhSqe1Cr8ZjXjYU43rsLXBp9kL6thtKxmUAgid6FRGukKJEVS7cwbisRilewELXCgSiSTAIixOthbXurS7LlbKQq2VoEmIIyqQRO/iahtgLW6sLSCoKIJCQJuSkCOIM341zv4ys35ijGObOcKFs5S2AUlRAsUgRmkW1FpuZua7FPrQtmUlKQkhKCkglNjmJ/qN9ZFXm3xkUSpeQgkSDmAG60iL208DWUddUVJUVZlBczfWZuT3UYXKe7Od8lvsvDqSWlEkZ0lNs06giPXQ+VXO0GVmLIDZIEKSArNJk2MRz1rOYDaDywV5AoIXMSYkyIF7HTyqG1sepR6qFhQXJ7c3kkZYt70i086iWGcpbj1UjSnDdnNntIyKi6uzBSixNxNgbd9ZzFuqwwW2pAKF6SQoxMwYOYb9eFXpYUpLfWNqWkMtlKTKhdIMwkkFRm88tKol7OdxEuhRUnMAUAXCZifAC/OoxpJ1IUiCNqNKUnM2EIjKcoiBebkkkX0irVplaFt9WCsHeLdk2gcJ58KVTsltYWZ9kQlE9rgJHujfeJoz70BCWgVqSm+VN0zxixFaum6iBqdlsoSqMisxiEkmACbwZhQ9eVWG0mzbKrKdyUhCZg3kqH6nfWCw+3VIDa0KKXEEgmRBT7pUNDvE1ssHtFh9aSElag3YncTxJ1Op86coyW5rCSaM3tzZYWp91SllZQkEEgpJuRHZG4GNAL0PCYXIntIK20pAQAe1bebQbaQRoae2lssMoLyPcUFlAnKq4jMJva0cKSxOFS646FEIIMAe5Cp7ITe8EjSpyb4xyQhsXEve3CerIOUEKzSZy9rQCTBULdmeYRxuICklClpKyvLmVAAEHM7mmLnsjkJ31a7UaDScpU5mSiBlJCCgnLFzOUbydLxVXisNnWkl5KQlA6gXKFAaCdU3BsRF6xxpOV0ZuL4ENqbO6pRyOBYAGk9kndO/jb5VdbE6au4dlLSW2YTvUVAnnYVnMZixlmBJMkC14gnl4V9J/8ONmNu4MKU22ohahK0JURpa+6/rXbKDUVY4u3sfKVqSQUiBwPHxoJQRz5UPuokk6+HxrVKjAnmBMVNYVYQZIkWknhAoCXIjQiZ8aM06cwUBO602pO1wAMIMCLk7vrXMuFJMjcQZomWSbgX1maggBKgSJ5WmPhVKQgQcNNYeReD+t9DDl4TIv32NWGA2ep5SGgU51k5ZUAAACTmO72aUmFCLhvMROgojJUFAaEkDzqDTgBmfGJ8vSiMuZnUxJlY7zcetP7AaPpG7KCZvnB9FfWqRGLVBAvN9dLa1e9KsO2C7liJBgT6d/GssFRN6dKSHPZllspcuSbBKD6H86s19KXMywQk5k5QFSQEiIjT+rzNU2zHxnuLb+6aXYdgkT+jqKmUE+UJSaL3Zu1lIJ7WbNZWa9pG8mdQK3u39qIRh2s6ErCmwYUrM1nMQSBeYNvG1fK1iLX0vPwrV9Msd1gwacOoFYYSVFN8oiMi2jISdLn0rPtuUkka450nZoei/SNjCpcJZAUsyEgSkQCISSSQm47/h5tvbq3w611SUtrBCVISINo75vF9JrBssupTATF5kqQm51IgWHIedCxL74TBcsNyVSfICtPweRuyXnRvk9IEpAZS2n2UpUYF0gQZAF5qp6SuIUpJQABoQkBIEAed5v8qxLuIdUMpWs8Bf6VNlvEIHZKwOSkitMfSzTtuxPMq3PoGF2w4pC0JxCOy0TBw4vBSMg7faO+3Co7W24peJUrrS0mMyf4BWQqBANxOqr7or58cW/cFxw8ZM38qKjFPq99Xw+VWul3/0N59jVv47rM2bFiCFE/wDlVJJVa3ZMXk3m0Uk9g8n+uyttRmUJKSFZZGZKu1oSI0ql6x/eqe8j6UVONxCdCrwVVLpa4/pEd5ev5NMMK+xPU4sRAVLbKTMzb2jJtvFCW48okHFEgpMn7O2FEJKRyMXO/dVJs7HOOuobNypUHMEkndFxPCvozGKcy5WUJyCwUrRUWkAaA7rG3DSsn0j8v/qil1EU91t+5l9tJxaGwftBcQlISP4SUwnKBBGo1ilsFgFFbSevzIVnOXKAQYFwlRIMmPKtavaWJC8qkMnfckz3dmiN7SUlYWplQKZ7TZkXBHsSeOoA76UumnHiv8Jf+DjnxPm/8mQRsp/2ljMNSApIlRUIygG9PYpl5zD2ZyjNkKQkBwiZkb8gj1pzbW18QlAUwUqEnOuEDLoAlQ1Sb6mRumqlStqKhRYWoR90W7ogzXI+5+ZJf80dFYvDbKhTSlkjNCkpsghWYgbhCdwveLCps7QdYEKzDOLHSUm27XSvHy+slLzS1LBEymFARpMTfWnsNsLrgFKS4IBGUDfNr8xyro1RjH5cGLW/xNO4+Ft2OUKCeza3YGnhSLbqAo5xYiDOgIBKbcd26aZVs1ZnK2qBpIG6AL24UtiMDdaHEhJWn+HJE50mbidMs3rgi4ttN7HQ7bLl5DoZbUhgOqXISJQcw1kb45V8428palqzo6q8ZU+zO8cJrdubVxS1NzDfVJICgIJBgdkHWQNTSy9nNFSC4SpQhQC1GJG8xF+VZQzwxO6NMmLUj5uprKAZB/KONbXojt3qGVJMmXCob7FKfpVricNhSMgaTljUoFtJ008xXqGGkgAJbgWGYX9Kqf8A9CLX0syjiaex8lI50RbRASogwRYm1OO7KUFLKSkpFwdPPWP2pxOynEoTlWlRsQmBF+Mi+gA4zXovJHmzmopwyRqlQm4ka8KKM7YMpibGd4O70NbBeJeCQXWm3Epy5RlBBIGhtY79YlPOqZeFcccCg0EJmAkXtx5CfnwrNZdXNDcUVBUkzAAJ3AmB51zbl9ATzsatMbs95cBLcAGE6TzJjQTNSwWx8QlxOdlSgCIiD/ULzEWIud9NTjXP8k0VmYZgqLyZI+nCndnNqU8AylWc+yEXJsZHlPlXmL2c5mzqaISSCpKbGFEkhI5GRMcDvp/YO02mHmlqQsoTmB/hgquk6dodo9nhAneKfjYIrcqcRhwTACk/iM5t5Mx8qAhkjwO79WrRsu4d5bTcLSAJzFnMpXsyCEqvYKg2vE61rNp7KwzwcCsicphrIh1smyYBsQbkjhJO8VKytNJopQvhmW6TwAsAW7Md01lQvlWrdUnEq6txfVAZhnUkkSkEoFuJGXxFU+0dmIQsBK+wY7apBufeEmIE+VdK9ESV7ieCUZJFhF/P42r1Dt7C/wAKYfSltRQlExZdzAIJGv600oGJgha0BKACOzM695mLetaLHqIY/gsKXBKoSiZkxJ/D9aYd2olCuqaT+IjefmeZrNocUoySeNzrTTSurQV++o27uNdENMVSRDjfI/i8eRaRIEqOscgD+tKrDjCmyB21HdeOXM0q+q0A63J/X6vTOAKUEEjvJ+A4d9UpNu7DSkiww4UlN1Ek6mdO6uZaCZie83oTiHVqkCE/rzplrDqA0UeZFbxp+DGW3km4obp038a5upBlR900ZvCq4R31dEWehmiIYr37IePmCKKMWlpslR7QmE7yd3hUvZAnYtsI/wDmXHB/ppUod4BCf+LLW+2Pj2lICPYUgZcqtbbxxEVgdiIysrV7zi0oHgcx9QjzoWL2v1RyKSQoXHWGOydCLzB5Wrhyzkn8TpjBNbm32ltMZ0gQCJAUTvgkCNbm3jTmBxgWgLK0ifAcN/xr54x0gaAIIIkaghcHcQDHxqyYylSTnCmleyoKy68RlJEGQRHPfJycskfq/stQi1SNZjXGldtKocTbrEiYH9W5aLmU/Awa7afSRz7OoFOVxMZilUTJEKBHukGZqhxD7ZQc5Wn7sjMOREnNHPLTCl52UqCQSixymZQTdKrkFN/DdrXPllrfyNYQpbDK9vpbQlQceK1jMUpIi3u2Jjed1O7Y6WuMFBSo5FIChBknTUmbi5rM7YwLjcBHabIC2iDBAIuNddxHEGgbcVLDTaUGWzqL2UnQkbpE3491ZutSTKjH42jRudJ0PJ/zFTvSs7+V4qLuKaUE/wAMlwaKGgB3X1rAJaWBMKjW4JFMYd11NwFEbwAfMWrWWKElTJUpxdxNO9tZedKFFSdAE3mTOsWCbHvpvFuuJSMqQpYFwSTumBw8azmA2gorClIkJMyoEwdNbRrWvweVKXHUkFRMEkzl1kAkE68NZGleZ1GGONpRVnpdPNOFy5/r9gD60tIzvWURZAJJmN9prIpUt2VhWUE6ZVK9YvVntlKkvZ8pU0tAVmKSYN4zW7N91G2RjF9UkJgQINtVcfhTxQUI6kuRylByoyLKnBMpXcXsasWMUlKL9kyRfLoNInvjyrfnoe2LoW4nuV+Veno0oaYhzxv8aqXUwkeeoMwZ2oEycgIBkGLSefcNO+vFbXMT2QDMb+UA6zcedbv/AA+sf6xI4FH51FXR2fa6pXe3+dR3sforSYsbV7FyrSLEabogzaRad19aRf2o7YhStwIzeVtIgV9FT0eSNUMn/wBMfWpr2C2YKmmDwlP7011EF4E4s+Zv4xaiJmfG/jvqWGxDmYSomb2N+4nd619Ic2OwjKSzh5JhIASmVHgSBGkzO6qXanQzGZ1LUwE8UsIQpMSdTmlR7+FdeB93hUiJRoQwGPdKCrOEAHQJUUhFgJypMXHs2pfEbRTZKHlmNVJbIBvPZlRIE8YqYeOHkErbUkHN2VII74OulqRe6RNxcpUfvZE5vEmSa610UVuZdxDOExbGY9aVLnfMHxFhwpg4TCOnMgrHLO0b8crkE+dUrm3gqwcUOQTHwIqx2XhX8SFKbzFCJzLcKUp0NpJE+yryrRdN6F3EuUJY5pCVHKXJB7WcAXPcSBP6ml2HyklSVEcdCD6UTFbTyFTaoGVSk6CJBIOWN0zelndqFUQ4LaSJjzBIrRQkvIak/BaO4hwpCl5SnWAie+TEDwmgo2oLgFKREXANuAJ/KkBjFHVweQ+lDKQdVHwAHxmq0z9iuPoccxuW4CRNpytkeFiKPs5CHTAcbCj99IHlETVR9lTxV6UQMpG4+cfCmlNA9LNHitntNwFvtlR0Dba3Phb1pI4S/wDlqIOiigpnvEkDzqsbgafH86ZQhR0BPdJq1q8szaXhDKsAdzfp9aOzsJatyR3/AJUfYTpWrIlJURqBu7+FbTB7Nci4Sn1NaOUVyzKpt7Iy+G6KT7TsfhH50830Pw+pUs+IHyrWYfZw3q8gB9aDiyGnA2RqJB4nh+1YzzwjyawwZGfLekS3U4lxtCMrbASpIH3JSouHeqTEkaAcjUsPsR7aKUvNJaTlHVklxUkpuCRlOWx3bjW52zsnDOOFa2sy8o1AWQmJFtNLxei4PBtsJIbbSCd6koSI/CgCfE1yS6mGq2jrj08tNJmLa/8ADbFH2nWUjkVqP/KK0uC6FstISlx4EjUm0z/dTuNcadUlKwpBSJCkymeWUHf4nnVNiEJDqUoYfUAr/NCojtA+8ndw31m+pUnSRa6drdyL5rYuEiC8hXIrzeUrPpU2dg4JsQHSkKnRSiIIi2sTNVTScq5SXkTv6tQsfAk+VNuuKSmErCuSkK9QYgeFZvMv0ovsP9TL4bKYdZS0FylCjBylVjqnuNtOWlqz72FThnS3LhbWTlJWE3ABIIvxGo8N9ebLxr7TeZSkZge0WwrLFgJ/OvOkDoeU2QFAElTgTJ7SghIV3dgExxtrU5JqX1JCjhrgIzsBJCUleJSk3UcyCAeCRlkjvqeA6Nw6pX2h1sboAIV3jdVxg0KU2heZztJBIMG8XHnNMFtXA1LxxfgdJFeejKClSftiwk3AjQ1DCdFsghOJOvLjPCrFaF7gr0PyoZK+CvIVk+niyviBX0edN+vzcpj5UH/D+I3OeQT8zTYdXwI8PpUOtc/r9an8NEKiRO0Wh/rHyR9BUDtZv+cB3oJ+FZYidVHxvQizXOsH3OfuGtO1U/8A1DXi2sf9dSRtCdHWFf3KHyNY8JHPzr0No3pUf7vyoeAO6bZLzh91s9zhP/667rV/yz4EH6VkWi2nQOj8Ln/xqxw+0gnRb39ygf8AprN4n4RSyL2JbU6VtDEKZcbcIQQlWUJPAke1x+Aq0wvTHApMJW6wdIAdQB/udk1hMXg8QXn322i4guKUSAFEQYuEyQLalNInHtlKv4RzEa5xl74yCvYw4koKglll6L7pFtJL75yLATmuouJzKKbFRvKYjlHnmqSlwps67OQGzijJUu2it40nyqh2skdc5+Nz/mNLJSJ8R8K74vY52rZq22+2A4olvOQrOmYRluQSJCh7UzqOFMN4LKC03iSrKqFIQlaSDJkAlNhJ1STEzckA4/DzAiRY3kjXUU5hsa43mCFqSFABUGyoMiQdb1Sl6JcPZdsbKcOX2E9tSCA2hULSD2Mykkk2M3gW0ojGzlqy9pozmH+Ux7QJEf5ek5b/ANVZp/ErUVSo3EGIAgqk2EAXrxDva7UqT2UlMkShOWEyLgWGlUmvQnF+zXYXZQVlSrKSodlaEISQqRAhISlQIKRcWKgZgGdFhegiApK+sDqCAQFJUkGbz2VzERvFfPXMaFuILTfVXSkwta80FMHtExEaCh4nFPLcdCXnZStUJ6xQGXMRAvAi1ZZHPiDo1xqK+tWfZ2NlJQmEs4UG0E4cnTucSZ5zXr2GcUkoJw6QQfZw8eIzOqvXxBGMKkg9aud4Lix5dq4qSlSn/NVP/wCQ/XurHRk/Uba8a/KfacBhVMTkWkSIENIGXdIGkxxB+NEXiMRBBxThHAN4YfBmRXxIBdv4g/8AcH/dRsLilNwtL5SsHTOYgXveDOkRQ8eT2NZMa/KfSWlNsAsspGbgZMkgm6tc3OqVrpE6kkZ1CDGUwfCdT51VoDmIJPmqwAt+vOnH22kAKBCnE75mIuVfvXJKbct+TppJbFxjdvdQgde+pJPuj2hy7Ik0XY+3GsTdLilhOo99NiBGa+/XSvnr7HXLK1ySdAJJA/VzS+BxCsI+hxJlPHcpOige7XwFaS6RuN6t/wCDnWZauNj6ftNxOcBouDsgqCSpS5UAYMJyg3vw5UinC39l86dogEaXsUi086tEY5sMdeoGCT2Qfekz638aqB0njRlPipVckYzfCOpsYw7byVSEwP8A02zy9gKPqKeScRPtAeCz65h8KqFdKHfdQhPnSrm38SffjuSPnVdmb5pC1F4+y8r2nFRpYR6zNLJ2PN+0fAn42qra6QPpm6Tc6pHHlRkdIHVf6aFdySaOxP2GpDIwqmyohzIkjtRmEAXKtTw9TagbA2+nF4g4bKpJWeyVFIK4ERASMki8X9nlU8VjXHkpYKcjjrgQJkQixJM6D5TVJtBAaeaxTCyQ1iEozWmLEK0HZUM1uR41rHBcfk9/BlObUtj6oMUnDpCHRlImLbgdRyqJ25h/5n/CayO0sU8sqDzhUpBypMpjSSNATuqovxT+vCunFgWhWznyZWpNH0E9IsMP9T/hVUT0kwv8w/7pNYByN6h6/wDbQSlJ+94T9KvsRJ7rPow27hz758iKknbmH/mHymvmbjKN5WO8ftUA03/NPl/8qOxEO6y+JSPeny+tSCk8j50qnEtcvGpoeRwHrXlmYyhaZ0+NS6xIOg9aSU8n9TXqXE8D5GgVj5y8BRAjgB4VXdcOBoqXY90+FILKrZ+IU2vOnVDqiPBxR8qqek2CDT7iUiEK7bf4FjMnymP7TRUYrKtaVgghxfL3yRI7oprpGA5g23hcsK6pcEE9WslTajyCs6fEV2401L9zrkrxr7Gb2oySvPolyVpJ357nT7qsyT3Unki8jj5WNM4fHpAyrGZuZjQpP3kG+U24EGLjSiONsKkpfgXs4hU3/BmB9K7kjmF0iBEix4jfepNokgDUmB3zFE6hm5OIQbgwhDuY8hmQEg8yYrxOIQtSs4SkK0KR7EWFveTFiNTrrqwIuYZQMZSZOUQCZUNQOJFDyHclRkyIBuBExxjfTv8AsZdilbCxcyl9oeBCykjxFeJ2Q4IKg1A1l9j/APpQIhsxBLzViJdRBIsRmTccRSTrhUSoEjMSYniZ+dOyGvYOZZBBWn2UgiCEGJUoiRm0ANpsoJxSGRZZWpQSnMpSiAlIkkkmABzmtiOj+FZhDpdedA/iFDoQ2Fb0p7BKgNM03IMCo7Awv2ZsPq/z3U/whvbaNi7yWsSE8Eyd4r0GubJkd0jqxYlVyB4vB4QIXlwygQkwS+4YMGDECayKlXgCPEn4mti77Ku4/CscUQZn9QKrE20yc8UmqNPh1dkcCAY8BXmOVCIHvGPDX5R417gz2EfgT/yiis3xLQOiZcj8IK48ckeNZ44/OzTI6gSde6ohhuQrRxST7SwLpnelJsBpYnfVftlkrazqHaFzzjeeJiRO+U8KbVkaLbrkQtwkjWElJHxPpRsbLiCu+QyEzvSnf4kC/LnXTzucnGw1s3GFWFQ2dCQuf7QI9Ca8Rh0GJWBxrtgZPs7QUY7AvpvrnXWR7xPcPrXK1u6O1PZFxgNm4Q+2/fhMVeM7CwuqEhfPOfrWCXjB7qfOopxqhcEp/CY+FQ8cn5K1I3CMNhUahgEWMkWIsdedCd20yiwXPJAt8hWMZaW5dKFq5gE+JNNO7OebTmWgpFte8Dd31DwRv5SYtbPdq7SzYhTosENEgcAr+H6BRV4UtjVNKZcDZmVwAP8A7ZgKPeLjvNLbOxIViFn2k5Qkd2ZAPzNN7OYSgrZyAFeIyg/0AoynT2SFa8zXYoUjllO5H03AbMQ80ha+cWSdTzBPCpr6OMHUKPiflFDY2uhCUpEQlIGpvH9vfTCNuovJHnx0rLTNcFOUXuxf/DWG/lk/3K+tEb6N4f8Akp8ZPxNNDb7I3iuPSZj7w/XhRWT7hcCCujuH3NIHchB+KTvqJ6Otn3lDkEN/9tSPSRn7wvUf8TMbz5UqmFxPnrmKYTqseleJ2nhjYKk8BJ9BVGnbzg9kNI/C02P+mor6S4nTr1juIT8KX4X7mGlGh+0Seww8r8LK/jEVI9eNMG5/cUI/5lVk3NrOq1dWe9avrSzmKJ1JPeTVLpYj0o3bRd1U2yj8T7fyJpdWIv2n8Kj8KnHD6IArFtlR9lJPcJplrCPK9ltflFV+GgOka5jCM4gnNGf74AuOMHUetODo0rDqWh0Th30Fta03SAr2V8UlKspvbWsvgsBjU6N24LyEeRMjwom2tpYlCEtvgwRKQFry25ZokfSpWFp7M6nmTW6MptLZ68O8pl0ZVpMEcRxHEHUGtN0I2cF+2w26BIGcJgqKkx2oKtCTwqve6UPkBLgbcSkQA4hC4HAFQJA5TUcJ0kdSrOylDagIhpITYmTbQ35V24p6b1Lwck4p/Sz6PtDozs4JChhkHsKUoJ6wHMAk5U5dJk+g30viehmzkwVMqSC2lch5cAqUBGkWBzW4aaVjk9OcWLqUkxMZ22jrYxKN/KrtvpLjlCSwyuUZboQDkN8puI7qmyGn7LA9AcET7LoGZSZDkmySoWI3pBJ3DiaxPTXYLeEUz1anCHEFf8QgkXgaAVqUdKcSlWZWFRPanKVic0ZgQHYI7ItG4RVNt/GJxhbU8l5sNpKU5EFzUzcrcm3jQ2OMXf8Asxkk2q+6M7MSSX3xLTZgIP8AquapR+HerlbeK8bwWEQZLz6uXUpSfMqIFW+A2lg1kJfLjbabIDUEJG8qkSSTcqHlAEZTntsbwhv8jzF4xTi1LUZUoyT8hwA0A3ACli8eNaZnG7EGq3FfiS/8kin2ukGx0ewlHeWXD8UE1z7+jqtezEdYo7ye6kh0axK1/wAJhageUDzMCvpv+NcEB2XAOSWlj/pAqp2104QpBSyq5tJBmPECKIzknshShGS3ZnmmurGRREpASYMiQIMEWIka1DCDPiVBO5tQH/tmfiarjjQLk0bo5iCnEIVvVmHipKkgeZFbwi92YZZKqC9KMC4yGSuScipO72j8ikd4NWWLcK2kKCk5UsJ7I3yDPqB516nGdaltL3aspV7mLED40i62lppyD/DJlJPuglQy+V47q1k6VHNH2yzwHR7ErQ2lKIGUAFRA3C8axzimk9E1Aw44B+FKiO6TEeVZr/ExGjyxaISjdwE6b78zxpN/bYVY9YscFrgeQrmcJvzR09xejc/7JwTX+Y8FHeFOADyTCvQ141tnAtGENpd5toVmHGCoBR891YD/AGp91CB/bmPmomuO1HDbMY4C3woWJeW2J5GfR19NVpSAzhsse+6oT3wQI75NZXb/AEyxDoyKWhQ1lJCoPfc84BjSqEYhRpIsKmwMVpHFBO0iHkk1VlnsF7K8iTAJKZ/ECmfWtTgUk4gLWkgJVlE2siSPhu4isQ2w590+laFjEOLAzwCLfnbUmBflWtOzNtUbn7U3vjXj+r0NT6OI1t9PzrKpBooB41ZkaFTqf0PSgqjcR86p0zzoiZO/9cKAHiAfHgfTlQ+rJuI/XhUG2zbhzvUgAN48Z+VACiOiTY9p4/D5UdPR3CJ9pwHxP1Fd9kP36Klsb1A+VZ6X7N+5Hwj1vBYNPuBfgfpTaPsyfZYv/Sn9qWSlI3+RqC1p4etGkO4/CLD7clP+j5x9a8XtR33UJA8D8qrlcq8zL4nzNGlC7khxW0XTrlHcPpaqfa2IDqSlxUjdEWPEUZ3DrOomkXtmFRvbvimkhOTfLMviWSkmLjw+tJqTFa9fR0nd+vWhK6Mq4geNAWZnDvZVBREkaTerBzbbh4eVPq6OK4ihK6PqmBeluPYrXNpLO80FeKUd5qyVsFfChnYjn3TRQWitLx41EuGn1bIcHunyoZ2av7p8qVDsTz15nNNKwChuNROCVwooLABw1MOjnUvsauFefZFUwslN6bw7xSQoGCDIPAjfSycKvhREYdz7tMk2WKwaMQ0h1gHN7K20gmJ3jj6WgxVDt9zK2hgGSLqgz3CdP0aDhmngLCO/8qKMAdVXNJRYOSKROGJo6MAo7qvGsHwB50ynCHhVaRayiRs6mmsCOHdV2nAmJIF6Zb2cbQB8PIamnpJ1FIjCDSKmjC2mPHdWgw+zTe3jvPgfnRWNmwJInhv9DTFZn28LMWt3a/M0yxhDe1x4R9e6r5rBDMJF/vW8hTLeDF+yR6es28KYrKZnCEEa3GsfD60ROHgGZnmdPlV6GQIMfrvNcvT2bHkPSKVgUvVRIGkd9/lUIPD0/U1ZOp/po2BwPWmM6G4++SPreiwKpJG8nxv+wphvTcP131YYvZwQSErS5GpbOaO/SKChKkiAD5UWBXJaJt+vWmEsxrAPfRy6rgB33PoK9hX6EfOoLBpw86egHzr1OFHGe4T8ooiJ3j0ouYb7+E0ABS0gcfOiBKNQPEmKnn8PD8qg6sD2jP65XoAA4RMykcrCfWvUpBG6OQ+lMNlJ0RHPT41LrE3A9CT8QBQIT6obh/wkVJLYm6ZPM/K0VJS0Dn3kfQV6cQn+mf1zpgTThk70j1+deHCI4Ach+1AXiRPteCRH70NWLItmIHCw+E0UA0rBoG7y/Oo9W0m5Ed+nyHrSSnZ3yfE/ryqCXN0knh+V6KEPqebOkd5A9LfOgLeQbZJPFQA9PyoGpkXPgI8DRVNE+95C/wAIooYNxsbkgT4+mooRw6NMotukX9KMMMOKu9VvyqZYjuPMUxCKcMCTKRygWHxFenBpiwB5wLdxg1ZMtW/7TfzNTLYFtO8ifhHrQBUDAo0EKPKCfSTRE4ITcGBuAHqd3lVq62kCAPBInz3etCy6JgdwST5xamIUThUC8BXLUDvMQPKiN4RJGYmfwyQPgKdQlJsq8aJnTwt6ijlgzy3WsKAK37KAJHwk+GkU0jAC1svEkCT4mSPSjoaSL5pV8P8AdFTZUEzGp3xFAEDg06ZR4XPifrXfZCBJGY7uyDHnb40YPGPmZNchwbj45Z+XzoA9aRlTc3Ot5PdIERUFBMyCQOcD6k+lFK83GBvMAeZp3B4bDrEqxCERuIn4xSsKK9KRM2I41GQT7QHj9KY2gwiZbc6xPGMo8CbHwpSJ3Duj86YUTzXtBNCeJ8eVSG+bcgBQnHT+35CgAiF296eNRcUI+8eelALoI1j9elR6wD2Z5x9aQ6DIlXZnwiwoiGxxJ8qRddG796GpR4x5UDofWQNVR3x9agVp1mfH9TXtdSSAivEITrbvEfnXDFDUR5R6murqAIKxJ3HyP1mgHF/vf9q6uoA4u8Y8b/X4UJzEfsSY+Xwrq6mAEvGdR3fvapgiNfIH46V1dQAYN2nQc7/CvAoDgOYI+GtdXUATKOKfMET4RXmbujlb4Xrq6kB6L6JHeQB85ooXl9nKD4fWfSvK6mIkgTdSvAAj4xPlXqGh7Uf3KTYeddXUxBh+IK77Dw3UVtEGcoPifpFdXUgPetG5I/tmoIhWsx3AD1iurqYBUAe4R4D5ipocUD2hPfXV1ICa8SN48BSxfbntg8hP11rq6mBz7iDoD3UIrJ4gV5XUAeBfG45/vRuutAEDkABXV1AwfWnv/XDU1BskkxPmfWurqQHHEZdU+JiPCdaEnGA6pnv0rq6gYFTgPP4D5elBLte11AAlOcp8aiXRXV1MD//Z"
      },
      { title: "gfsd", price: "60$",link:'5',authorId:1
      ,img:"data:image/jpeg;base64,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"
      },
      { title: "dsafa", price: "20$",link:'6',authorId:3
      ,img:"data:image/jpeg;base64,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"
      },
      { title: "dada", price: "55$",link:'7',authorId:3
      ,img:"data:image/jpeg;base64,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"
    },
];



   



   





// ---PopupCards---
    const corner_list =[
      {id:1,imageUrl:c1,price:'100'},
      {id:2,imageUrl:c2,price:'50'},
      {id:3,imageUrl:c3,price:'35'},
      {id:4,imageUrl:c4,price:'29'},
    
    ]






// book not found [at end cause make condition and nothing after that can define]
      if (!book) {
        return <div>Loading book details or book not found...</div>;
      }









    return (
    <div>

        <div className="book-nav-res"><SimpleNav/></div>

      <div className="book-container">

        <div className="book-nav-full"><Navbar/></div>

          {/* Main Content */}
          <div className="main">
            {/* Book Image & Info */}
            <div className="main-book">
              <div className="book-card">
                <img 
                  className='bk-slide-image'
                  src={book.imageUrl}
                  alt={book.name} 
                  loading="lazy"
                />
                <div className="info">
                  <h2 className='bk-slide-title'>{book.name}</h2>
                  {/* Category */}
                  <div className='book-categories'>
                    {book.category.map((category,index)=>(
                      <div 
                       key={index}
                       label={category}
                       onClick={() => handleCategory(category)} 
                     >
                     <p className='book-categories-link'>{category}</p>
                     </div>
                    ))}
                  </div>


                  <div className="author-wrapper">
                    <p className='extra-info' 
                     id='ext'
                     onClick={handleAuthor}
                    >
                      {book.author?.name || 'unknown author'}
                    </p>
                  </div>
                 </div>
                
              
                {/* Like Button */}
                <button 
                  onClick={handleLike} 
                  className={isMobile ? 'mobile-like':'like'}
                >
                  <svg
                    width={isMobile ? "24" : "32"}
                    height={isMobile ? "24" : "32"}
                    viewBox="0 0 24 24"
                    fill={liked ? "red" : "none"}
                    stroke={liked ? "red" : "black"}
                    strokeWidth="2"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                             2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                             C13.09 3.81 14.76 3 16.5 3
                             19.58 3 22 5.42 22 8.5
                             c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </div>
            </div>


          {/* Side Card (Format & Price) */}
            <div className="side-card">
              <div className="chooser">
                <label htmlFor="book-format">Format:</label>
                <select 
                  ref={priceref}
                  value={format}
                  onChange={handleFormatChange} 
                  name="book-format" 
                  id="book-format">
                  <option value="" disabled defaultValue hidden>choose one</option>
                  
                    <option value="physical">physical</option>
                    <option value="pdf">pdf</option>
                  
                </select>
              </div>
                <span className='show-price'>{price || 'Select format'}</span>
                <button className='book-buy-btn'>Add to Cart</button>

            </div>

          </div>
        

      {/* Rest of Page*/}
      <div className="book-rest">
        {/* Corner Cards */}
          <motion.div
              className='corner-cards-container'
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }} 
              variants={containerVariants}
              
          >
              {corner_list.map((cornercard) => (
                    <motion.div
                      key={cornercard.id}
                      className="corner-card-wrapper"
                      variants={cardVariants}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="corner-card-label-topright">
                        {cornercard.price}$
                      </span>

                      <div className="corner-card">
                        <motion.img
                          src={cornercard.imageUrl}
                          whileHover={{ scale: 1.05 }}
                        />
                      </div>
                    </motion.div>
                  ))}

          </motion.div>



          {/* About Book */}
          <div className="about-book">
            <div className="about-book-content">
              <h1>About book</h1>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Egestas purus viverra accumsan in nisl nisi. Arcu cursus vitae congue mauris rhoncus aenean vel elit scelerisque. In egestas erat imperdiet sed euismod nisi porta lorem mollis. Morbi tristique senectus et netus. Mattis pellentesque id nibh tortor id aliquet lectus proin. Sapien faucibus et molestie ac feugiat sed lectus vestibulum. Ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget. Dictum varius duis at consectetur lorem. Nisi vitae suscipit tellus mauris a diam maecenas sed enim. Velit ut tortor pretium viverra suspendisse potenti nullam. Et molestie ac feugiat sed lectus. Non nisi est sit amet facilisis magna. Dignissim diam quis enim lobortis scelerisque fermentum. Odio ut enim blandit volutpat maecenas volutpat. Ornare lectus sit amet est placerat in egestas erat. Nisi vitae suscipit tellus mauris a diam maecenas sed. Placerat duis ultricies lacus sed turpis tincidunt id aliquet. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Egestas purus viverra accumsan in nisl nisi. Arcu cursus vitae congue mauris rhoncus aenean vel elit scelerisque. In egestas erat imperdiet sed euismod nisi porta lorem mollis. Morbi tristique senectus et netus. Mattis pellentesque id nibh tortor id aliquet lectus proin. Sapien faucibus et molestie ac feugiat sed lectus vestibulum. Ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget. Dictum varius duis at consectetur lorem. Nisi vitae suscipit tellus mauris a diam maecenas sed enim. Velit ut tortor pretium viverra suspendisse potenti nullam. Et molestie ac feugiat sed lectus. Non nisi est sit amet facilisis magna. Dignissim diam quis enim lobortis scelerisque fermentum. Odio ut enim blandit volutpat maecenas volutpat. Ornare lectus sit amet est placerat in egestas erat. Nisi vitae suscipit tellus mauris a diam maecenas sed. Placerat duis ultricies lacus sed turpis tincidunt id aliquet.
              </p>
              
              </div>
          </div>









        {/* sliders */}
        <ReusableSlider
          items={slider_items_same_author}
          title="Same Author"
          customClass="same-author"
        
        />
        <ReusableSlider
          items={slider_items_same_vibe}
          title="From Your Taste"
          viewAllLink="/categories"
          customClass="same-vibe"
        
        />
        
        {/* Comments Section */}

        <div className="comment-section">
            <div className="my-comment">
              <textarea 
                type="text"
                className='comment-content'
                placeholder='type...'
                onChange={(e)=>{
                   setCommentText(e.target.value);
                  }}
                value={commenttext}
              />
              <button
                className='comment-btn'
                disabled={isButtonDisabled}
                onClick={handlecomment}
              >
                post
              </button>

              <Notification ref={notificationRef} />

            </div>
            <div className="users-comment">
              {commentsToShow && commentsToShow.map((u,index)=>(
                    <div key={index} className="user-comment">
                        <p className='comment-account'>{u.username}</p>
                        <p className='user-comment-content'>{u.content}</p>
                        <div className="like-dislike-icons-container">
                            <div className="like-dislike-icons">
                                
                                <button 
                                  onClick={handleCommentLike}
                                  className="like-dislike-icons-btn"
                                  >


                              <svg   
                                    xmlns="http://www.w3.org/2000/svg"
                                    width='24'
                                    height='24'
                                    viewBox="0 0 24 24"
                                    // fill="none"
                                    stroke='rgb(180,180,180)'
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M7 10v12" />
                                    <path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                                  </svg>
                                </button>


                           
                                <button 
                                  onClick={handleCommentDislike}
                                  className="like-dislike-icons-btn"
                                >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width='24'
                                  height='24'
                                  viewBox="0 0 24 24"
                                  className="like-dislike-icons-btn-svg"
                                  id='dislike-btn'
                                  // fill="none"
                                  stroke='rgb(180,180,180)'
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17 14V2" />
                                  <path d="M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
                                </svg>
                                </button>
                              </div>


                                <div className="like-dislike-count">
                                  <span className="like-dislike-icons-count">
                                    {commentlike}
                                  </span>
                                  <span className="like-dislike-icons-count">
                                    {commentdislike}
                                  </span>
                                </div>

                            
                        </div>
                        
                    </div>
                  
                ))}
                {/* Show More / Less */}
                {book?.comments && book?.comments.length > 3 && !showallcomments && (
                     <button 
                     className="show-btn"
                     onClick={() => setShowAllComments(true)}
                   >
                     Show more ({book.comments.length - 3})
                   </button>
                )}

                {showallcomments && (
                      <button 
                        className="show-btn"
                        onClick={() => setShowAllComments(false)}
                      >
                        Show Less
                      </button>
                  )}
            </div>
        </div>




      </div>
      {/* Footer */}
      <div className="last">
        <Footer/>
      </div>


      {/* Mobile Navigation */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-content">
          <div className="mobile-format-picker">
            <select 
              value={format}
              onChange={handleFormatChange}
              >
               <option value="" disabled>Select format</option>
               <option value="physical">physical</option>
               <option value="pdf">pdf</option>
            </select>
          </div>
          <div className="mobile-price-cart">
            <span className="mobile-price">{price || 'Select format'}</span>
            <button className="mobile-add-to-cart">Add to Cart</button>
          </div>
        </div>
      </div>






    </div>
  </div>
);
}
