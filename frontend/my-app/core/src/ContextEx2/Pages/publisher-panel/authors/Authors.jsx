// ✅
import React,{useState} from 'react'
import {
  Tab,
  Tabs
} from '@mui/material';
import Editauthors from './Editauthors';
import Allauthor from './Allauthor';

import '../../../Styles/publisher-panel/Authors.css'
import { useCallback } from 'react';





// ============================================
//    Main 
// ============================================
export default function Authors({ currentPublisher, onProposalCreated }) {

  //---State--- 
  const [value,setValue]= useState(0); // 0  Edit, 1  All
  const [authorToEdit, setAuthorToEdit] = useState(null);

//---Handlers---
  const handleTabChange = useCallback((_, newValue) => {
    setValue(newValue);
    if(newValue === 0){
      setAuthorToEdit(null)
    }
  },[])

  const handleEditAuthor = useCallback((author)=>{
    setAuthorToEdit(author);
    setValue(0);
  },[])

  const clearEditMode = useCallback(()=>{
    setAuthorToEdit(null);
  },[])

  return (
    <div  className='authors-container'>
      {/* Tabs */}
      <Tabs
        value={value}
        onChange={handleTabChange}
        aria-label='setting navigation tabs'
        sx={{
              borderBottom:2 ,
              borderColor:'divider',
              mb:3,
              mt:2,
        
              '& .Mui-selected':{
                color:"white !important"
              },
              '& .MuiTabs-indicator':{
                backgroundColor:'white'
              }
            }}
        >
            <Tab label={authorToEdit ? "Edit Author" : "New Author"} sx={{color:'white'}}/>
            <Tab label="All Authors" sx={{color:'white'}}/>
        </Tabs>

        <div className='form-authors-container' >
          {value === 0 &&
            <Editauthors
              authorToEdit={authorToEdit}
              onEditComplete={() => {
                clearEditMode();
                setValue(1); // Switch to All Authors tab
              }}
              currentPublisher={currentPublisher}
              onProposalCreated={onProposalCreated}
            />
          }
          {value === 1 &&
            <Allauthor
              onEditAuthor={handleEditAuthor}
            />
          }
        </div>
    </div>
  )
}
