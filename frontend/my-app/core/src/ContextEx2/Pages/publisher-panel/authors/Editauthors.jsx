// ✅
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Notification from '../../../Components/feature/Notification';
import PublisherService from '../../../Services/PublisherService';
import { TextField } from '@mui/material';

import '../../../Styles/publisher-panel/Editauthors.css'

// ============================================
// Constants
// ============================================
const MIN_NAME_LENGTH = 3;
const MIN_BIO_LENGTH = 10;

// ============================================
//    Main 
// ============================================
export default function Editauthors({ authorToEdit, onEditComplete, currentPublisher, onProposalCreated }) {

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
        bio:authorToEdit.biography || authorToEdit.bio || '',
        profilePic:authorToEdit.profilePic || null,
      });

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



  const handleSubmit = useCallback(async (e)=>{

      e.preventDefault();

      if(AuthorValidation()){
        if (!currentPublisher) {
          notificationRef.current.showNotif('No active publisher selected', 'error');
          return;
        }

        try {
          if(isEditMode){
            await PublisherService.updateAuthorProposal({
              publisher_id: currentPublisher.id,
              author: authorsform.id,
              name: authorsform.name.trim(),
              biography: authorsform.bio.trim(),
            });

            notificationRef.current.showNotif('Author update proposal submitted for review!', 'success');

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
              if (onProposalCreated) {
                onProposalCreated();
              }
            }, 1000);

          }else{
            await PublisherService.createAuthorProposal({
              publisher_id: currentPublisher.id,
              name: authorsform.name.trim(),
              biography: authorsform.bio.trim(),
            });

            notificationRef.current.showNotif('Author creation proposal submitted for review!', 'success');

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
              if (onProposalCreated) {
                onProposalCreated();
              }
            }, 1000);
          }
        } catch (err) {
          console.error('Failed to submit author proposal:', err);
          const data = err.response?.data;
          let msg = 'Failed to submit author proposal';
          if (typeof data === 'object') {
            const firstVal = Object.values(data)[0];
            msg = Array.isArray(firstVal) ? firstVal[0] : (typeof firstVal === 'string' ? firstVal : msg);
          }
          notificationRef.current.showNotif(msg, 'error');
        }
      }
 
  },[authorsform,AuthorValidation,isEditMode,currentPublisher,onEditComplete,onProposalCreated])






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
                loading='lazy'
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
