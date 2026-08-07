// ✅
import React,{useState,useCallback} from 'react'
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography
} from '@mui/material';
// style in Profile.css




// ============================================
//    Main 
// ============================================
export default function Passwordpart({updateProfile,notificationRef}) {
  
  // ---State---
    const [passwordData, setPasswordData] = useState({
      // currentPassword: '',
      newPassword: '',
      repeatPassword: '',
    });


  // ---Memoized Values---
    const isFormValid = passwordData.newPassword.length >= 6 && 
    passwordData.repeatPassword.length >= 6;








// ---Handlers---

    const handleChange = useCallback((e) => {
      const { name, value } = e.target;
      setPasswordData((prev) => ({ ...prev, [name]: value }));
    },[])


  
    const handleSubmit = useCallback((e) => {
      e.preventDefault();
      if (passwordData.newPassword !== passwordData.repeatPassword) {
        notificationRef.current.showNotif('Passwords dont match','error')
        return;
      }

      // do check and strength test ⚠️
      if (passwordData.newPassword.length < 8) {
        notificationRef.current?.showNotif('Password must be at least 8 characters', 'error');
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
        // currentPassword: '',
        newPassword: '',
        repeatPassword: '',
      });
    },[notificationRef,updateProfile,passwordData])
  



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
              label="Repeat New Password"
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
                disabled={!isFormValid}
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

