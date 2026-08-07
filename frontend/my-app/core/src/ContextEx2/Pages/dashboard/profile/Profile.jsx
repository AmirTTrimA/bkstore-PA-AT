// ✅
import { useState,useEffect,useCallback,useRef } from 'react';
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
import Accountpart from './Accountpart';
import Passwordpart from './Passwordpart'
import { useAuth } from '../../../Context/AuthContext';

import "../../../Styles/components/Profile.css"
// style in globals.css





// ============================================
//    Main 
// ============================================
export default function Profile({open,onClose}) {

  const {user}=useAuth();
  const notificationRef = useRef();

  //---State--- 
  const [value,setValue]= useState(0); // 0 Account, 1 Password
  const [profileData, setProfileData] = useState({
      username: user?.username || 'User',
      age: '',
      password:''
  });

  



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
        <Box className="mod-box"> 
                {/* Close Button */}
                <IconButton 
                  onClick={onClose}
                  sx={{ 
                    mt:0.2,
                    p: 0.2,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                  }}>
                        <CloseIcon />
                </IconButton>
              {/* Title */}
              <Typography 
                variant="h4"
                component='h2'
                gutterBottom
                sx={{mb:2,textAlign:'center',fontWeight:'800'}} 
              >
                Edit Profile
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
                  <Tab label="Account"/>
                  <Tab label="Password"/>

              </Tabs>
              
              {/* Tab Content */}
              <Box p={3} border={1} borderColor="grey.200" borderRadius={1}>

                  {value === 0 &&(
                    <Accountpart 
                      profileData={profileData}
                      updateProfile={updateProfile}
                      notificationRef={notificationRef}
                    />
                  )}
                  
                  {value === 1 && (
                    <Passwordpart
                      profileData={profileData}
                      updateProfile={updateProfile}
                      notificationRef={notificationRef}
                    />
                  )}

              </Box>
            </Box>
          </Modal>

        <Notification ref={notificationRef}/>
      </div>
  )
}
