// ✅
import React,{useState,useRef,useCallback,useEffect} from 'react'

import {
  Modal,
  Box,
  Tab,
  Tabs,
  Typography,
  IconButton
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import Notification from '../../../Components/feature/Notification';
import Wallet from './Wallet';
import History from './History';
// style in globals.css



// ============================================
//    Main 
// ============================================
export default function Financial({open,onClose}) {
  

    //---State--- 
    const [value,setValue]= useState(0); // 0 Wallet, 1 History,
    const [profileData, setProfileData] = useState({
      username: '',
      age: '',
      fullname:'',
      phone:'',
      postcode:'',
    });
  
    
    
  
   
 
    //---Ref---
    const notificationRef = useRef();
  
  
  
  
  
  
//---Effects---
  useEffect(()=>{
      const savedData = localStorage.getItem('user-profile');
      if(savedData){
        setProfileData(JSON.parse(savedData));
      }
    },[])
  

//---Handlers---
const handleTabChange = useCallback((_, newValue) => {
  setValue(newValue);
},[])

const saveProfileToLocalStorage = useCallback((data) => {
      localStorage.setItem('user-profile', JSON.stringify(data));
    },[]);
  
const updateProfile = useCallback((updates) => {
    setProfileData(prev=>{
      const updated = { ...prev, ...updates };
      saveProfileToLocalStorage(updated);
      return updated
    });
    
  },[saveProfileToLocalStorage]);
  
  
  
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

                <Typography 
                  variant="h4"
                  component='h2'
                  gutterBottom
                  sx={{mb:1,mt:1,textAlign:'center',fontWeight:'800'}}
                >
                    Financial
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
                        },

                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                      }}
                  >
                    <Tab label="Wallet"/>
                    <Tab label="History"/>
                </Tabs>
                {/* Tab Content */}
                <Box  border={1} borderColor="grey.200" borderRadius={1} sx={{overflowY:'auto', flex:1}}>

                    {value === 0 && (
                      <Wallet  
                        profileData={profileData}
                        updateProfile={updateProfile}
                        notificationRef={notificationRef}
                     />
                    )}
                    {value === 1 && <History/>}
  
                </Box>
          </Box>
      </Modal>
          <Notification ref={notificationRef}/>
      </div>
  
    )
}
