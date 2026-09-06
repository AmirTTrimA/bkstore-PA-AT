// ✅
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import Notification from '../../Components/feature/Notification';
import PublisherService from '../../Services/PublisherService';

import "../../Styles/publisher-panel/Upload.css"

// ============================================
//    Constants
// ============================================
const MIN_NAME_LENGTH = 3;
const MIN_ABOUT_LENGTH = 10;
const ERROR_DISPLAY_DURATION = 2000;

// ============================================
//    Main 
// ============================================

export default function Upload({
  bookToEdit,
  handleDeleteBooks,
  PageChanger,
  clearEditMode,
  currentPublisher,
  onProposalCreated
}) {

  //---Refs---
  const notificationRef = useRef()
  const intervalRef = useRef(null); 

  //---State---
  const [uploadbooks,setUploadBooks]= useState({
      id: '',
      name:'',
      author:'',
      type:'physical',
      genre:'FICTION',
      category:[],   
      price:'',
      discount:'',
      bookImage:'',
      aboutbook:'',
      isbn: ''
  })
  const [authors,setAuthors]= useState([]);
  const [error,setError] = useState({});
  const [submitError, setSubmitError] = useState('') 
  const [previewUrl, setPreviewUrl] = useState(null);

  const isEditBookmode = bookToEdit !== null;

  const isFormValid = useMemo(() => {
    const { name, author, type, price, aboutbook } = uploadbooks;
    return (
      name?.trim().length >= MIN_NAME_LENGTH &&
      String(author)?.trim().length > 0 &&
      type?.trim().length > 0 &&
      String(price)?.trim().length > 0 &&
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

  //---Load Authors from API---
  useEffect(() => {
    let isMounted = true;
    const fetchAuthors = async () => {
      try {
        const authorsData = await PublisherService.getAuthors();
        if (isMounted) {
          setAuthors(authorsData || []);
        }
      } catch (err) {
        console.error('Failed to load authors from API:', err);
      }
    };
    fetchAuthors();
    return () => { isMounted = false; };
  }, []);

  useEffect(()=>{

    if(isEditBookmode){
      const matchingAuthor = authors.find(
        a => a.name === bookToEdit.author || a.id === bookToEdit.raw?.author?.id || a.id === bookToEdit.author
      );

      setUploadBooks({
        id:bookToEdit.id,
        name:bookToEdit.name || bookToEdit.title || '',
        author: matchingAuthor ? matchingAuthor.id : (bookToEdit.raw?.author?.id || bookToEdit.author || ''),
        type:bookToEdit.type || 'physical',
        genre: bookToEdit.raw?.genre || (bookToEdit.category?.[0]) || 'FICTION',
        category:bookToEdit.category || ['FICTION'],
        price:bookToEdit.price || '',
        discount:bookToEdit.discount || '0',
        bookImage:bookToEdit.bookImage || null,
        aboutbook:bookToEdit.aboutbook || bookToEdit.raw?.description || '',
        isbn: bookToEdit.isbn || bookToEdit.raw?.isbn || '',
      });

      if(bookToEdit.bookImage && typeof bookToEdit.bookImage === 'string'){
        setPreviewUrl(bookToEdit.bookImage);
      }

    }else{
      setUploadBooks({
        id:'',
        name:'',
        author: authors.length > 0 ? authors[0].id : '',
        type:'physical',
        genre:'FICTION',
        category:['FICTION'],
        price:'',
        discount:'0',
        bookImage:null,
        aboutbook:'',
        isbn: '',
      });
      setPreviewUrl(null);
    }

  },[isEditBookmode, bookToEdit, authors])






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
    PageChanger('mybook')

  },[PageChanger,clearEditMode])




// // chain dependency
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

    // Price validation
    if(!uploadbooks.price || uploadbooks.price.toString().trim() === ''){
      newerror.price = 'price required';
      isValid=false;
    }else if(parseFloat(uploadbooks.price) <= 0){
      newerror.price = 'price cant be 0'
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
      newerror.aboutbook = 'about book required';
      isValid=false;
    }else if(uploadbooks.aboutbook.trim().length < MIN_ABOUT_LENGTH){
      newerror.aboutbook = `about book must be at least ${MIN_ABOUT_LENGTH} character`
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
      return;
    }

    const errorList = Object.values(errors);
    if (errorList.length === 0) return;

    let index=0;
    setSubmitError(errorList[0]);

    intervalRef.current = setInterval(()=>{
      index++;
      if(index < errorList.length){
        setSubmitError(errorList[index]);
      }else{
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setTimeout(() => {
          setSubmitError('');
        }, 500);
      }
    }, ERROR_DISPLAY_DURATION);
  }

  const handleSubmit = useCallback(async (e)=>{
    e.preventDefault();

    const {isValid ,errors: valErrors} = BookValidation();

    if(!isValid){
      showErrors(valErrors);
      return;
    }

    if (!currentPublisher) {
      notificationRef.current.showNotif('No active publisher selected', 'error');
      return;
    }

    try {
      if(isEditBookmode){
        const updatePayload = {
          publisher_id: currentPublisher.id,
          book: uploadbooks.id,
          title: uploadbooks.name.trim(),
          description: uploadbooks.aboutbook.trim(),
          genre: uploadbooks.genre || 'FICTION',
          is_digital: uploadbooks.type === 'pdf' || uploadbooks.type === 'digital',
          is_audio: uploadbooks.type === 'audio',
          cover_image_url: typeof uploadbooks.bookImage === 'string' && uploadbooks.bookImage.startsWith('http')
            ? uploadbooks.bookImage
            : (bookToEdit?.raw?.cover_image_url || 'https://picsum.photos/400/600'),
          digital_file_path: '',
          audio_file_path: '',
        };

        await PublisherService.updateBookProposal(updatePayload);

        if (uploadbooks.price && parseFloat(uploadbooks.price) > 0) {
          try {
            await PublisherService.changePriceProposal({
              publisher_id: currentPublisher.id,
              book: uploadbooks.id,
              value: Math.round(parseFloat(uploadbooks.price)),
              reason: 'Price update from publisher dashboard',
            });
          } catch (priceErr) {
            console.warn('Price change proposal notice:', priceErr);
          }
        }

        notificationRef.current.showNotif('Book update proposal submitted for review!', 'success');
        
        setTimeout(() => {
          if (clearEditMode) clearEditMode();
          if (onProposalCreated) onProposalCreated();
          PageChanger('mybook');
        }, 1000);

      } else {
        const createPayload = {
          publisher_id: currentPublisher.id,
          author: parseInt(uploadbooks.author, 10),
          title: uploadbooks.name.trim(),
          isbn: uploadbooks.isbn?.trim() || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          description: uploadbooks.aboutbook.trim(),
          genre: uploadbooks.genre || 'FICTION',
          is_digital: uploadbooks.type === 'pdf' || uploadbooks.type === 'digital',
          is_audio: uploadbooks.type === 'audio',
          cover_image_url: typeof uploadbooks.bookImage === 'string' && uploadbooks.bookImage.startsWith('http')
            ? uploadbooks.bookImage
            : 'https://picsum.photos/400/600',
          digital_file_path: '',
          audio_file_path: '',
        };

        await PublisherService.createBookProposal(createPayload);
        notificationRef.current.showNotif('Book creation proposal submitted for review!', 'success');

        setTimeout(() => {
          setUploadBooks({
            id:'',
            name:'',
            author: authors.length > 0 ? authors[0].id : '',
            type:'physical',
            genre:'FICTION',
            category:['FICTION'],
            price:'',
            discount:'0',
            bookImage:null,
            aboutbook:'',
            isbn: '',
          });
          setPreviewUrl(null);
          if (onProposalCreated) onProposalCreated();
          PageChanger('mybook');
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to submit book proposal:', err);
      const data = err.response?.data;
      let errMsg = 'Failed to submit proposal';
      if (typeof data === 'object') {
        const firstVal = Object.values(data)[0];
        errMsg = Array.isArray(firstVal) ? firstVal[0] : (typeof firstVal === 'string' ? firstVal : errMsg);
      }
      notificationRef.current.showNotif(errMsg, 'error');
    }

  },[uploadbooks, BookValidation, isEditBookmode, currentPublisher, clearEditMode, onProposalCreated, PageChanger, bookToEdit, authors])

  return (
    <div className="upload-books-container">
      <h4 className='upload-title'>
        {isEditBookmode ? 'Edit Book Proposal' : 'Submit New Book Proposal'}
      </h4>
        
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
          placeholder={isEditBookmode ? 'Edit book title':'Enter book title'} 
          required
        />

        {/* Author */}
        <select
          name="author"
          onChange={handleChange}
          className={`upload-field ${error?.author ? 'error-border' : ''}`}
          value={uploadbooks.author}
          required
        >
          <option value="" disabled hidden>Choose author</option>
          {authors.map( item =>
            <option key={item.id} value={item.id} className="upload-options">
              {item.name}
            </option>
          )}
        </select>

        {/* Genre */}
        <select 
          name="genre"
          onChange={handleChange}
          className="upload-field"
          value={uploadbooks.genre || 'FICTION'}
        >
          <option value="FICTION">Fiction</option>
          <option value="SCI_FI">Science Fiction</option>
          <option value="HISTORY">History</option>
          <option value="SCIENCE">Science</option>
          <option value="TECH">Technology</option>
          <option value="BUSINESS">Business</option>
        </select>

        {/* Type */}
        <select 
          name="type"
          onChange={handleChange}
          className={`upload-field ${error?.type ? 'error-border' : ''}`}
          value={uploadbooks.type}
        >
          <option value="physical" className="upload-options">Physical</option>
          <option value="pdf" className="upload-options">Digital (E-Book)</option>
          <option value="audio" className="upload-options">Audiobook</option>
        </select>

        {/* ISBN */}
        <input 
          type="text"
          className="upload-field"
          value={uploadbooks.isbn || ''}
          name='isbn'
          onChange={handleChange}
          placeholder={isEditBookmode ? 'ISBN' : 'ISBN (optional, auto-generated if blank)'} 
        />

        {/* Price */}
        <input 
          type="number"
          className={`upload-field ${error?.price ? 'error-border' : ''}`}
          value={uploadbooks.price}
          name='price'
          onChange={handleChange}                 
          placeholder={isEditBookmode ? 'Edit price (IRR)':'Enter price (IRR)'} 
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
        />

        {/* About Book */}
        <textarea 
          type="text" 
          className={`upload-field ${error?.aboutbook ? 'error-border' : ''}`}
          value={uploadbooks.aboutbook}
          name='aboutbook'
          onChange={handleChange}
          id="abouttextarea"
          placeholder={isEditBookmode ? 'Edit description':'Enter description'} 
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

        {previewUrl && (
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <img 
              src={previewUrl} 
              alt="Book cover preview" 
              style={{ maxWidth: '140px', maxHeight: '200px', borderRadius: '8px' }} 
            />
          </div>
        )}

        {/* Buttons */}
        <div className="upload-btn-group">
          {isEditBookmode && (
            <button 
              type='button'
              onClick={()=>handleDeleteBooks(uploadbooks.id)}
              className="upload-btn-delete"
            >
              Delete
            </button>
          )}
          <button
            type='submit'
            className='upload-btn-main'
            disabled={!isFormValid}
          >
            {isEditBookmode? 'Submit Update Proposal':'Submit Upload Proposal'}
          </button>

          {isEditBookmode && (
            <button 
              type='button'
              onClick={()=>handleCancel()}
              className="upload-btn-cancel"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <Notification ref={notificationRef}/>
    </div>
  )
}
