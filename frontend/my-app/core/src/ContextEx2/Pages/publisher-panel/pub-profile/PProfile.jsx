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
import PPassword from '../../dashboard/profile/Passwordpart';
import PAccount from '../../dashboard/profile/Accountpart';
import { useAuth } from '../../../Context/AuthContext';
import { useLanguage } from '../../../Context/LanguageContext';

import "../../../Styles/publisher-panel/PProfile.css"
// style in globals.css



// ============================================
//    Main 
// ============================================
export default function PProfile({open,onClose}) {

  const { t } = useLanguage();
  const {user}=useAuth();
  const notificationRef = useRef();
  

  //---State--- 
  const [value,setValue]= useState(0); // 0 Account, 1 Password, 2 Address
  const [profileData, setProfileData] = useState({
    username: user?.username || 'User',
    age: '',
    fullname:'',
    phone:'',
    postcode:'',
    address:''
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
            <IconButton 
              onClick={onClose}
              sx={{ 
                mt:0.2,
                p: 0.2,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}>
                    <CloseIcon />
            </IconButton>
          <Typography 
            variant="h4" 
            component='h2' 
            gutterBottom 
            sx={{mb:2,textAlign:'center',fontWeight:'800'}}
          >
            {t("publisher_panel.edit_publisher", "Edit Publisher")}
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
                }}
            >
              <Tab label={t("dashboard.personalInfo", "Account")}/>
              <Tab label={t("dashboard.security", "Password")}/>
          </Tabs>

          <Box p={3} border={1} borderColor="grey.200" borderRadius={1}>

              {value === 0 && (
                <PAccount 
                  profileData={profileData} 
                  updateProfile={updateProfile} 
                  notificationRef={notificationRef}
                />
              )}
              {value === 1 && <PPassword/>}

          </Box>
    </Box>
</Modal>
    <Notification ref={notificationRef}/>
</div>
    
)
}
