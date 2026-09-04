// ✅
import React,{useState,useCallback,useEffect} from 'react'
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography
} from '@mui/material';
// style in Profile.css


// ============================================
//    Constants
// ============================================
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_PATTERNS = [
  /[a-z]/, 
  /[A-Z]/, 
  /[0-9]/, 
  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 
];


// ============================================
//    Main 
// ============================================
export default function Passwordpart({updateProfile,notificationRef}) {
  
  // ---State---
    const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      repeatPassword: '',
    });

    const [strength, setStrength] = useState('none');

  // ---Memoized Values---
    const isValid = 
    passwordData.currentPassword &&
    passwordData.newPassword &&
    passwordData.repeatPassword 



  // ---Effects---
  useEffect(()=>{

    const checkStrength = (pass)=>{

      if(!pass || pass.length === 0) return 'none';
        
      
      
      let score = PASSWORD_PATTERNS.reduce((count, pattern) => 
        count + (pattern.test(pass) ? 1 : 0), 0
      );

      // Length bonus
      if (pass.length >= MIN_PASSWORD_LENGTH) score++;

      
      if (score<=2) return 'weak';
      if (score<=4) return 'medium';
      if (score>=5) return 'strong';
      
    }


    setStrength(checkStrength(passwordData.newPassword))
  
  },[passwordData.newPassword])
  





// ---Handlers---

    const handleChange = useCallback((e) => {
      const { name, value } = e.target;
      setPasswordData((prev) => ({ ...prev, [name]: value }));
    },[])


  
    const handleSubmit = useCallback((e) => {
      e.preventDefault();

    

      
      if (passwordData.newPassword.length < MIN_PASSWORD_LENGTH) {
        notificationRef.current?.showNotif('Password not Strong (8)', 'error');
        return false;
      }

      if (strength === 'weak' || strength === 'medium' || strength === 'none' ) {
        notificationRef.current?.showNotif('Password must contain (symbols,number,upper,lower)', 'error');
        return false;
      }


      if (passwordData.newPassword !== passwordData.repeatPassword) {
        notificationRef.current.showNotif('Passwords dont match','error')
        return;
      }



      
      const NewPass ={
        password:passwordData.newPassword.trim()
      }

      // Update profile
      updateProfile(NewPass);
      console.log('Submitting Password Change:', passwordData);
      notificationRef.current.showNotif('New pass confirmed','success')

      // Clear fields 
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        repeatPassword: '',
      });
    },[notificationRef,updateProfile,passwordData,strength])
  



return (
      <Box 
        component="form"
        onSubmit={handleSubmit}
        sx={{ mt: 1 }}
        >

        <Typography 
          variant="h6"
          gutterBottom
          sx={{ mb: 1 }}
        >
            Change Password
        </Typography>

        <Grid container spacing={2} >
          <Grid 
            size={12}
            sx={{
              display:'flex',
              flexDirection:'column',
              alignItems:'center'
              }}
            >
          
          {/* Old Password */}
          <TextField
              fullWidth
              label="Current Password"
              name="currentPassword"
              type="password"
              className="customTextField"
              value={passwordData.currentPassword}
              onChange={handleChange}
              sx={{ mb: 2 }}
              required
            />


          {/* New Password */}
            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type="password"
              className="customTextField"
              value={passwordData.newPassword}
              onChange={handleChange}
              sx={{ mb: 2 }}
              required
            />

            {/* Repeat Password */}
            <TextField
              fullWidth
              label="Repeat Password"
              name="repeatPassword"
              type="password"
              className="customTextField"
              value={passwordData.repeatPassword}
              onChange={handleChange}
              required
            />
          </Grid>

          {/* Submit Button */}
          <div className="pass-btn">
            <Button 
                type="submit"
                variant="contained"  
                disabled={!isValid}
                sx={{
                  p:1.5,
                  mt:2,
                  backgroundColor:'red'
                }}
            >
              Update Password
            </Button>
    
          </div>
        </Grid>
      </Box>
    );
  }

