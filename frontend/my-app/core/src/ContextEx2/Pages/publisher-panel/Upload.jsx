// ✅
import React, { useCallback } from 'react'
import { useEffect,useState,useRef, useMemo } from 'react';
import Notification from '../../Components/feature/Notification';


import "../../Styles/publisher-panel/Upload.css"



// ============================================
//    Constants
// ============================================
const MIN_NAME_LENGTH = 3;
const MIN_CATEGORY_LENGTH = 3;
const MIN_ABOUT_LENGTH = 50;
const ERROR_DISPLAY_DURATION = 2000;

// ============================================
//    Main 
// ============================================

export default function Upload({bookToEdit,handleDeleteBooks,PageChanger,clearEditMode}) {

  //---Refs---
  const notificationRef = useRef()
  const intervalRef = useRef(null); 

 

  //---State---
  const [uploadbooks,setUploadBooks]= useState({
      name:'',
      author:'',
      type:'',
      category:[],   
      price:'',
      discount:'',
      bookImage:'',
      aboutbook:''
  })
  const [authors,setAuthors]= useState([]);
  const [error,setError] = useState({});
  const [submitError, setSubmitError] = useState('') 
  const [categoryInput, setCategoryInput] = useState('');

  // eslint-disable-next-line no-unused-vars
  const [currenterrorindex, setCurrentErrorIndex] = useState(0) //error tracker
  // eslint-disable-next-line no-unused-vars
  const [previewUrl, setPreviewUrl] = useState(null);



  const isEditBookmode = bookToEdit !==null;
  const isFormValid = useMemo(() => {
    const { name, author, type, category, price, discount, aboutbook } = uploadbooks;
    return (
      name?.trim().length >= MIN_NAME_LENGTH &&
      author?.trim() &&
      type?.trim() &&
      category?.length > 0 &&
      price?.trim() &&
      discount?.trim() &&
      aboutbook?.trim().length >= MIN_ABOUT_LENGTH
    );
  }, [uploadbooks]);


//---Effects---
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);


  //---Load Authors---
  useEffect(()=>{
    const availableAuthors = localStorage.getItem('authors-list');
    const existAuthor = availableAuthors ? JSON.parse(availableAuthors) : null;

    if (existAuthor && Array.isArray(existAuthor)) {
      setAuthors(existAuthor);
    }else {
      setAuthors([]);
    }

  },[])



  useEffect(()=>{

    if(isEditBookmode){
      
      setUploadBooks({
        id:bookToEdit.id,
        name:bookToEdit.name || '',
        author:bookToEdit.author || '',
        type:bookToEdit.type || '',
        category:bookToEdit.category || [],
        price:bookToEdit.price || '',
        discount:bookToEdit.discount || '',
        bookImage:bookToEdit.bookImage || null,
        aboutbook:bookToEdit.aboutbook || '',
      });

      if (bookToEdit.category && Array.isArray(bookToEdit.category)) {
        setCategoryInput(bookToEdit.category.join(', '));
      } else {
        setCategoryInput('');
      }

      if(bookToEdit.bookImage && typeof bookToEdit.bookImage === 'string'){
        setPreviewUrl(bookToEdit.bookImage);
      }


    }else{
      setUploadBooks({
        id:'',
        name:'',
        author:'',
        type:'',
        category:[],
        price:'',
        discount:'',
        bookImage:null,
        aboutbook:'',
      });
      setCategoryInput('');
      setPreviewUrl(null);
    }




  },[isEditBookmode,bookToEdit])






//---Handlers---

const handleChange = useCallback((e)=>{
  if (!e || !e.target) {
    console.error('Event or event.target is null', e);
    return;
  }


  const { name , value ,type ,files } = e.target;

  if (type === 'file') {
    setUploadBooks({ ...uploadbooks, [name]: files[0] });
  } else if (name!== 'category') {
    setUploadBooks({ ...uploadbooks, [name]: value });
  }


  if (submitError) {
    setSubmitError('');
    if(intervalRef.current){
      clearInterval(intervalRef.current);
      intervalRef.current=null;
    }
  }
  if (error && error[name]) {
    setError({...error,[name]: ''});
  }
},[error,uploadbooks,submitError])



  const handleBookImage = useCallback((e)=>{
    const file = e.target.files[0];
    if(file){
      setUploadBooks({
        ...uploadbooks,
        bookImage:file
      });

      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);


      if (error.bookImage) {
        setError({
          ...error,bookImage: ''
        });
      }
    }
  
  
  },[error,uploadbooks])


  const handleCancel= useCallback((e)=>{

    if(e){
      e.preventDefault();
    }

    if(clearEditMode){
      clearEditMode();
    }
    setUploadBooks({
      id:'',
      name:'',
      author:'',
      type:'',
      category:[],
      price:'',
      discount:'',
      bookImage:null,
      aboutbook:'',
    })
    setCategoryInput('')
    setPreviewUrl(null);


    PageChanger('mybook')


  },[PageChanger,clearEditMode])




  const handleCategoryInput = useCallback((e) => {
    const value = e.target.value;
    setCategoryInput(value);
    
    const categoriesArray = value.split(',').map(cat => cat.trim()).filter(cat => cat);
    setUploadBooks({ ...uploadbooks, category: categoriesArray });
  
  },[uploadbooks])




// chain dependency
  const BookValidation = useCallback(()=>{
    let isValid = true;
    const newerror={};


      // Name validation
      if(!uploadbooks.name || !uploadbooks.name.trim()){
        newerror.name = 'name required';
        isValid=false;
      }else if(uploadbooks.name.trim().length < MIN_NAME_LENGTH){
        newerror.name = `name must be at least ${MIN_NAME_LENGTH} character`
        isValid=false
      }

      // Category validation
      if(!uploadbooks.category || !uploadbooks.category.length === 0){
        newerror.category = 'category required';
        isValid=false
      }else if(uploadbooks.category.some(cat=>cat.length <MIN_CATEGORY_LENGTH)){
        newerror.category = `category must be at least ${MIN_CATEGORY_LENGTH} character`
        isValid=false
      }


      // Price validation
      if(!uploadbooks.price || !uploadbooks.price.toString().trim() === ''){
        newerror.price = 'price required';
        isValid=false
      }else if(parseFloat(uploadbooks.price) <= 0){
        newerror.price = 'price cant be 0'
        isValid=false
      }


      // Discount validation
      if(!uploadbooks.discount || !uploadbooks.discount.toString().trim() === ''){
        newerror.discount = 'discount required';
        isValid=false
      }else if(parseFloat(uploadbooks.discount) > parseFloat(uploadbooks.price || 0)){
        newerror.discount = `dicount cant be less than price (${uploadbooks.price})`
        isValid=false
      }


     // Author validation
     if(!uploadbooks.author){
       newerror.author = 'select author';
       isValid=false;
     }

     // Type validation
     if(!uploadbooks.type){
       newerror.type = 'select type';
       isValid=false;
     }


     // Aboutbook validation
     if(!uploadbooks.aboutbook || !uploadbooks.aboutbook.trim()){
      newerror.aboutbook = 'aboubook required';
      isValid=false;
      }else if(uploadbooks.aboutbook.trim().length < 50){
      newerror.aboutbook = 'aboubook must be at least 50 character'
      isValid=false
      }


    setError(newerror);
    return {isValid, errors:newerror};


  },[uploadbooks])


  const showErrors = (errors)=>{

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }


    if(!errors || typeof errors !== 'object'){
      console.log('error not an obj');
      return;
    }



    const errorList = Object.values(errors);
    
    if (errorList.length === 0) return;

    let index=0;

    setSubmitError(errorList[0]);
    setCurrentErrorIndex(0);

    intervalRef.current = setInterval(()=>{
      index++;

      if(index < errorList.length){
        setSubmitError(errorList[index]);
        setCurrentErrorIndex(index);
      }else{
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        setTimeout(() => {
          setSubmitError('');
        }, 500);

      }



    },ERROR_DISPLAY_DURATION) //show each error for 2s



  }






  const handleSubmit = useCallback((e)=>{
    e.preventDefault();


    const {isValid ,errors} = BookValidation();


    if(isValid){


      const existBooks = localStorage.getItem('accepted-books');
      let savedbooks = existBooks ? JSON.parse(existBooks): [];


      if (!Array.isArray(savedbooks)) {
        savedbooks = [];
      }



      if(isEditBookmode){
        const updatedBooks = savedbooks.map(book=>
          book.id === uploadbooks.id
          ?{
            ...book,
            name: uploadbooks.name.trim(),
            author: uploadbooks.author.trim(),
            type: uploadbooks.type.trim(),
            category: uploadbooks.category,
            price: uploadbooks.price.trim(),
            discount: uploadbooks.discount.trim(),
            aboutbook: uploadbooks.aboutbook.trim(),
            bookImage: uploadbooks.bookImage instanceof File 
              ? URL.createObjectURL(uploadbooks.bookImage)
              : uploadbooks.bookImage || book.bookImage,
            updatedAt: new Date().toISOString(),
          }
          :book );


          localStorage.setItem('accepted-books',JSON.stringify(updatedBooks));
          notificationRef.current.showNotif('Author updated successfully!', 'success');
          
          // Clear edit mode 
          setTimeout(() => {
            setUploadBooks({
              id:'',
              name:'',
              author:'',
              type:'',
              category:[],
              price:'',
              discount:'',
              bookImage:null,
              aboutbook:'',
            });
            setCategoryInput('');
            setPreviewUrl(null);

            if (clearEditMode) {
              clearEditMode();
            }
          }, 1000);
          
          
          
      }else{
          
        const newBooks={
          id: Date.now(),
          name:uploadbooks.name,
          author:uploadbooks.author,
          type:uploadbooks.type,
          category:uploadbooks.category,
          price:uploadbooks.price,
          discount:uploadbooks.discount,
          aboutbook:uploadbooks.aboutbook,


          bookImage:uploadbooks.bookImage instanceof File
          ? URL.createObjectURL(uploadbooks.bookImage):null,

          createdAt: new Date().toISOString(),
        }


        savedbooks.push(newBooks);

        localStorage.setItem('accepted-books',JSON.stringify(savedbooks));
        setSubmitError('');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setUploadBooks({
          name:'',
          author:'',
          type:'',
          category:[],
          price:'',
          discount:'',
          bookImage:null,
          aboutbook:'',
        });
        setCategoryInput('');
        setPreviewUrl(null);
        notificationRef.current.showNotif('Book uploaded successfully','success');

      }



    }else{
      showErrors(errors);
    }

  },[uploadbooks,BookValidation,isEditBookmode,clearEditMode])



  return (
    <div className="upload-books-container">
      <h4 className='upload-title'>please enter book feature</h4>
        
        {submitError && (
            <div className="upload-errors-container">
              <div className="upload-errors-message">
                {submitError}
              </div>
            </div>
          )}

      <form 
        className='upload-form'
        onSubmit={handleSubmit}
      >
            {/* Name */}
            <input 
              type="text"
              name='name'
              className={`upload-field ${error?.name ? 'error-border':''}`}
              value={uploadbooks.name}
              onChange={handleChange}
              placeholder={isEditBookmode ? 'Edit name':'Enter name'} 
              required
              />

              {/* Author */}
              <select
                name="author"
                onChange={handleChange}
                className={`upload-field ${error?.author ? 'error-border' : ''}`}
                value={uploadbooks.author}
              >
                <option value="" disabled defaultValue hidden>choose author</option>
                  {authors.map( item=>
                    <option key={item.id} className="upload-options" >{item.name}</option>
                  )}

              </select>

              {/* Type */}
              <select 
                name="type"
                onChange={handleChange}
                className={`upload-field ${error?.type ? 'error-border' : ''}`}
                value={uploadbooks.type}
              >
                  <option value="" disabled defaultValue hidden>choose type</option>
                    <option value="physical" className="upload-options" >physical</option>
                    <option value="pdf" className="upload-options" >pdf</option>
              </select>


              {/* Category */}
              <input 
                type="text"
                className={`upload-field ${error?.category ? 'error-border' : ''}`}
                value={categoryInput}
                name='category'
                onChange={handleCategoryInput}
                placeholder={isEditBookmode ? 'Edit category':'Enter category(comma)'} 
                required
              />

              {/* Price */}
              <input 
                type="number"
                className={`upload-field ${error?.price ? 'error-border' : ''}`}
                value={uploadbooks.price}
                name='price'
                onChange={handleChange}                 
                placeholder={isEditBookmode ? 'Edit price':'Enter price'} 
                required
              />

              {/* Discount */}
              <input 
                type="number" 
                className={`upload-field ${error?.discount ? 'error-border' : ''}`}
                value={uploadbooks.discount}
                name='discount'
                onChange={handleChange}
                placeholder={isEditBookmode ? 'Edit discount':'Enter discount'} 
                required   
              />

              {/* About Book */}
              <textarea 
                type="text" 
                className={`upload-field ${error?.aboutbook ? 'error-border' : ''}`}
                value={uploadbooks.aboutbook}
                name='aboutbook'
                onChange={handleChange}
                id="abouttextarea"
                placeholder={isEditBookmode ? 'Edit about':'Enter about'} 
                required   
              />

              {/* Book Image */}
              <input 
                type="file"
                accept='image/*'
                id='bookImage'
                className='upload-field'
                name='bookImage'
                onChange={handleBookImage}
                placeholder='bookImage' 
                />


              




        {/* Buttons */}
        <div className="upload-btn-group">
              {isEditBookmode &&
                 <button 
                  type='button'
                  onClick={()=>handleDeleteBooks(uploadbooks.id)}
                  className="upload-btn-delete"
                 >
                    Delete
                  </button>
              }
              <button
                type='submit'
                className='upload-btn-main'
                disabled={!isFormValid}
              >
                {isEditBookmode? 'Update':'Upload'}
              </button>


              {isEditBookmode &&
                <button 
                type='button'
                onClick={()=>handleCancel()}
                className="upload-btn-cancel"
                >
                  Cancel
                </button>
              }

        </div>
             
      </form>

      <Notification ref={notificationRef}/>
    </div>
  )
}
