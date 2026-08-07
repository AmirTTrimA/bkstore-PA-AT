// ✅
import React,{useState, useRef, useMemo, useCallback} from 'react'
import {
  Box,
  Button,
  Avatar,
  Grid,
  TextField,
  Typography
} from '@mui/material';
// style in Profile.css

// ============================================
// Constants
// ============================================
const MIN_USERNAME_LENGTH = 3;
const MIN_AGE = 13;
const MAX_AGE = 120;


// ============================================
//    Main 
// ============================================

export default function Accountpart({profileData,updateProfile,notificationRef}) {
    
    //---State--- 
    const [useraccount,setUserAccount]=useState({
      username:profileData.username,
      age:profileData.age
    })

    const [errors, setErrors] = useState({
      username:'',
      age:''
    });

    const [preview, setPreview] = useState(null);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef();
  



  // ---Memoized Values---
  const isFormValid = useMemo(() => {
    const username = useraccount.username?.trim();
    const age = parseInt(useraccount.age);
    return username?.length >= MIN_USERNAME_LENGTH && 
           age >= MIN_AGE && 
           age <= MAX_AGE;
  }, [useraccount]);






//---Handlers---
    
    const handleFileSelect = useCallback((event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      setFileName(file.name);
  
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    },[])
    
    const handleChange = useCallback((e) => {
      const { name, value } = e.target;
      setUserAccount(prev=>({ ...prev , [name]: value }));
      if(errors[name]){
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    },[errors])


    const Validations=useCallback(()=>{

      let isValid=true;
      const newErrors = {
        username:'',
        age:''
      }

      // username validation
      if(!useraccount.username || useraccount.username.trim()===""){
        newErrors.fullname = 'Username required';
        isValid=false;
      }
      else if(useraccount.username.trim().length < MIN_USERNAME_LENGTH){
        newErrors.username = `Username must be at least ${MIN_USERNAME_LENGTH} character`;
        isValid=false;
      }

      const ageValue = useraccount.age.trim();
      // age validation
      if(!useraccount.age || useraccount.age.trim()===""){
        newErrors.fullname = 'Age required';
        isValid=false;
      }
      else if (isNaN(ageValue) || ageValue > MAX_AGE || ageValue < MIN_AGE){
        newErrors.age = `Age must be between ${MIN_AGE}-${MAX_AGE}`;
        isValid=false;
      }

      setErrors(newErrors);
      return isValid;


    },[useraccount])





  
    const handleSubmit = useCallback((e) => {
      e.preventDefault();
      if (!Validations()) {
        notificationRef.current.showNotif('Please fix the errors','error')
        return;
      }

      // Clean the data
      const cleanData = {
        username:useraccount.username.trim(),
        age:useraccount.age.trim(),
      };

      updateProfile(cleanData);

      notificationRef.current.showNotif('Account information update!','success')

    },[useraccount,Validations,updateProfile,notificationRef])
  
    return (
      <Box component="form" onSubmit={handleSubmit} >
        <Typography 
          variant="h6"
          gutterBottom
          className="account-pic"
        >
            Account Details
        </Typography>
        
        {/* Picture Upload Section */}
        <Grid container spacing={2}>
          <Grid 
            size={12}
            className="account-pic"
            sx={{ display:'flex' , flexDirection:'column' , alignItems:'center'}}
            >
              <Avatar className="account-pic"
                src={preview || undefined} 
                alt="Profile Preview"
                sx={{ width: 80, height: 80, mb: 2 }}
                />
              <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
              />
              <Button 
                  variant="outlined" 
                  size="small"
                  color="primary"
                  onClick={() => fileInputRef.current.click()}
              >
                  {fileName ? 'Change Picture' : 'Upload Picture'}
              </Button>
              {fileName && (
                  <Typography 
                    variant="caption"
                    display="block"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                      Selected: {fileName.substring(0, 20)}...
                  </Typography>
              )}
          </Grid>
        </Grid>
          
          {/* Name and Age Fields */}
          <Grid container spacing={2} sx={{mt:2}}>
            <Grid size={12}>
              <TextField
                  fullWidth
                  label="UserName"
                  name="username"
                  className="customTextField"
                  value={useraccount.username || ''}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                  error={!!errors.username}
                  helperText={errors.username}
                  required
              /> 

              <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  type="number"
                  className="customTextField"
                  value={useraccount.age || ''}
                  onChange={handleChange}
                  error={!!errors.age}
                  helperText={errors.age}
                  required
              />
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Button 
          type="submit"
          variant="contained"
          className='save-btn'
          disabled={!isFormValid}
          sx={{
            p:1.5,
            mt:2,
            backgroundColor:'red'
            }} 
          >
          Save Changes
        </Button>
      </Box>
    );
  }

