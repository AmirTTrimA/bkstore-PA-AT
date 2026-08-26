// ✅
import React,{useState,useRef,useEffect} from 'react'
import {
    Modal,
    Box,
    Tab,
    Tabs,
    Typography,
    IconButton
  } 
  from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import Manually from './Manually';
import GPS from './GPS';
import Notification from '../../../Components/feature/Notification'
import { useCallback } from 'react';
// style in globals.css



// ============================================
//    Constants
// ============================================
const NOTIFICATION_DURATION = 2000;


// ============================================
//    Main 
// ============================================
export default function NewAddresses({open,onClose,onSave,editingAddress}) {


  // ---State---
    const [value,setValue]= useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    //---Ref---
    const notificationRef = useRef();


    
//---Effects---
      useEffect(() => {
        if (open && editingAddress) {
          setIsEditing(true);
          setEditingId(editingAddress.id);
        } else if (!open) {
          setIsEditing(false);
          setEditingId(null);
        }
      }, [open, editingAddress]);
    



//---Handlers---

      const handleTabChange = useCallback((_, newValue) => {
        setValue(newValue);
      },[])


      const handleSaveAddress = useCallback((addressData) => {
        onSave(addressData, isEditing, editingId);
        if (isEditing) {
          notificationRef.current.showNotif('Address Updated!', 'success');
        } else {
          notificationRef.current.showNotif('New Address Added!', 'success');
        }
        // Close Modal after Notif
        setTimeout(() => {
          onClose();
        }, NOTIFICATION_DURATION); 
        

      },[editingId,isEditing,onSave,onClose])












    return (
    <div>
       <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="profile-modal-title"
        aria-describedby="profile-modal-description"
      >
        <Box className="mod-box mod-special"> 
                {/* Close Button */}
                <IconButton 
                  onClick={onClose}
                  sx={{  
                    display:'flex',
                    justifyContent:'flex-start',
                    width:'fit-content',
                    mt:0.2,
                    p: 0.2,
                    '&:hover': { bgcolor: 'white' }
                    }}>
                        <CloseIcon />
                </IconButton>
              {/* Title */}
              <Typography 
                variant="h5"
                component='h2'
                gutterBottom
                sx={{
                  mb:2,
                  textAlign:'center',
                  fontWeight:'800'}}
              >
                {isEditing ? 'Edit Address' : 'Add New Address'}
              </Typography>
              
              {/* Tabs */}
              <Tabs
                value={value}
                onChange={handleTabChange}
                aria-label='setting navigation tabs'
                variant='fullWidth'
                sx={{
                      borderBottom:2 ,
                      borderColor:'divider',
                      mb:1,
                      mt:2,

                      '& .Mui-selected':{
                        color:"red !important"
                      },
                      '& .MuiTabs-indicator':{
                        backgroundColor:'red'
                      }
                    }}
                >
                  <Tab label="Manually"/>
                  <Tab label="GPS"/>
              </Tabs>
              {/* Tab Content */}
              <Box 
                p={3}
                border={1}
                borderColor="grey.200"
                borderRadius={1}
                sx={{
                  overflowY:'auto',
                  flex:1
                  }}
              >

                  {value === 0 && (
                    <Manually
                        notificationRef={notificationRef}
                        onSave={handleSaveAddress}
                        editingAddress={editingAddress}
                        isEditing={isEditing}

                    />
                    )}
                  {value === 1 && <GPS/>}
                  
              </Box>
        </Box>
    </Modal>

        <Notification ref={notificationRef}/>
    </div>
  )
}
