// ✅

import React,{useState,useRef,useEffect,useMemo} from 'react'
import Notification from '../../../Components/feature/Notification';
import { TextField } from '@mui/material';

import '../../../Styles/publisher-panel/Editauthors.css'
import { useCallback } from 'react';


// ============================================
// Constants
// ============================================
const MIN_NAME_LENGTH = 3;
const MIN_BIO_LENGTH = 10;

// ============================================
//    Main 
// ============================================
export default function Editauthors({authorToEdit,onEditComplete}) {




  //---State---
  const [authorsform,setAuthorsForm] = useState({
    id:'',
    name:'',
    bio:'',
    profilePic:'',
  });
  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);


  //---Ref---
  const notificationRef = useRef('');


    // ---Memoized Values---
    const isEditMode = useMemo(() => authorToEdit !== null, [authorToEdit]);
    const isFormValid = useMemo(() => {
      return (
        authorsform.name?.trim().length >= MIN_NAME_LENGTH &&
        authorsform.bio?.trim().length >= MIN_BIO_LENGTH
      );
    }, [authorsform]);



//---Effects---
  useEffect(()=>{
    if(isEditMode){
      setAuthorsForm({
        id:authorToEdit.id,
        name:authorToEdit.name || '', 
        bio:authorToEdit.bio || '',
        profilePic:authorToEdit.profilePic || null,
      });

      // if profilePic ecist set it as preview
      if(authorToEdit.profilePic && typeof authorToEdit.profilePic === 'string'){
        setPreviewUrl(authorToEdit.profilePic);
      }

    }else{
      setAuthorsForm({
        id:'',
        name:'',
        bio:'',
        profilePic:null,
      });
      setPreviewUrl(null);

    }

  },[isEditMode,authorToEdit])





  //---Handlers---
  const handleChange =useCallback((e)=>{
    const { name , value } = e.target;
    setAuthorsForm({...authorsform,[name]:value});
    
    if (errors[name]) {
      setErrors({...errors,[name]: ''});
    }
  },[errors,authorsform])



  const handleFileChange = (e)=>{
    const file = e.target.files[0];
    if(file){
      setAuthorsForm({
        ...authorsform,
        profilePic:file
      });

      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);


      if (errors.profilePic) {
        setErrors({
          ...errors,profilePic: ''
        });
      }
    }
  
  
  }

  const AuthorValidation = useCallback(()=>{
    let isValid = true;
    const newErrors={};


    if(!authorsform.name.trim()){
      newErrors.name = 'Name required';
      isValid=false;
    }else if(authorsform.name.trim().length < MIN_NAME_LENGTH){
      newErrors.name = `Name must be at least ${MIN_NAME_LENGTH} character`
      isValid=false
    }
    if(!authorsform.bio.trim()){
      newErrors.bio = 'Bio required';
      isValid=false
    }else if(authorsform.bio.trim().length < MIN_BIO_LENGTH){
      newErrors.bio = `Bio must be at least ${MIN_BIO_LENGTH} character`
      isValid=false
    }


    setErrors(newErrors);
    return isValid;


  },[authorsform])


  const handleCancel=useCallback(()=>{
    if (onEditComplete) {
      onEditComplete(); 
    }
    setAuthorsForm({
      id: '',
      name: '',
      bio: '',
      profilePic: null,
    });
    setPreviewUrl(null);
  },[onEditComplete])



  const handleSubmit = useCallback((e)=>{

      e.preventDefault();

      if(AuthorValidation()){

        const existingAuthors = localStorage.getItem('authors-list');
        let savedAuthors = existingAuthors ? JSON.parse(existingAuthors) : [];

        if (!Array.isArray(savedAuthors)) {
          savedAuthors = [];
        }
      

        
        if(isEditMode){
          const updatedAuthors = savedAuthors.map(author=>
            author.id === authorsform.id
            ?{
              ...author,
                name: authorsform.name.trim(),
                bio: authorsform.bio.trim(),
                profilePic: authorsform.profilePic instanceof File 
                  ? URL.createObjectURL(authorsform.profilePic)
                  : authorsform.profilePic || author.profilePic,
                updatedAt: new Date().toISOString(),
            }:author);

            localStorage.setItem('authors-list', JSON.stringify(updatedAuthors));
            notificationRef.current.showNotif('Author updated successfully!', 'success');

            setTimeout(() => {
              setAuthorsForm({
                id: '',
                name: '',
                bio: '',
                profilePic: null,
              });
              setPreviewUrl(null);

              if (onEditComplete) {
                onEditComplete();
              }
            }, 1000);


          //Create new author
          }else{
            const authorExists = savedAuthors.some(auth => auth.name.toLowerCase() === authorsform.name.trim().toLowerCase());
            
            if(!authorExists){

              const newAuthors = {
                id: Date.now(),
                name:authorsform.name,
                bio:authorsform.bio,
  
                profilePic:authorsform.profilePic instanceof File
                ? URL.createObjectURL(authorsform.profilePic):null,
  
                createdAt: new Date().toISOString(),
              }
  
                savedAuthors.push(newAuthors);
                localStorage.setItem('authors-list',JSON.stringify(savedAuthors));
      
      
                setAuthorsForm({
                  name: '',
                  bio: '',
                  profilePic: null,
                });
                setPreviewUrl(null);
                notificationRef.current.showNotif('Added to waiting queue','success');
  
            }else{
              notificationRef.current.showNotif('Authors  already exist','error');
            }


          }

      }
 
  },[authorsform,AuthorValidation,isEditMode,onEditComplete])






  return (
    <div  className='edit-authors-container' >
       <form onSubmit={handleSubmit}>
      <div className='edit-authors-form'>
          
          {/* Name Field */}
          <TextField
            fullWidth
            name="name"
            label="name"
            className='edit-inputs'
            placeholder={isEditMode ? 'Edit author name':'Enter author name'}
            value={authorsform.name || ''}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}

            required

          />
          
        
        
          {/* Bio Field */}
          <TextField
            fullWidth
            name="bio"
            label="bio"
            className='edit-inputs'
            placeholder={isEditMode ? "Edit author bio" : "Enter author bio"}
            value={authorsform.bio || ''}
            onChange={handleChange}

            error={!!errors.bio}
            helperText={errors.bio}
            multiline
            rows={3}
            required
          />
          
        </div>
        
        {/* Profile Picture */}
        <div style={{ marginBottom: '10px' }}>
          <label className='edit-authors-profile-label'>
            Profile Picture
          </label>
          <input
            type="file"
            name="profilePic"
            onChange={handleFileChange}
            accept="image/*"
            className='edit-authors-pic-input'
            
          />
          {previewUrl && (
            <div className='selected-authors-pic'>
              <img 
                src={previewUrl} 
                alt="Preview"  
              />
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="edit-submit">
            <button
              type="submit"
              className="edit-submit-btn"
            >
              {isEditMode ? 'Update':'Submit'}
            </button>
            {isEditMode &&
                <button
                className="edit-cancel-btn"
                onClick={()=>handleCancel()}
                disabled={!isFormValid}
                >
                  Cancel
                </button>
            }
            
        </div>
        
      </form>
      <Notification ref={notificationRef} />
    </div>
  )
}
