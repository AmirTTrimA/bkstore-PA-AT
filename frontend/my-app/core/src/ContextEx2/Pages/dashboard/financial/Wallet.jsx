// ✅
import React,{ useState,useRef,useCallback } from 'react'
import {
  Box,
  Button,
  Grid,
  Typography
} from '@mui/material';
import Notification from '../../../Components/feature/Notification';
// style in Profile.css


// ============================================
//    Constants
// ============================================
const DEFAULT_BALANCE = 0;


// ============================================
//    Main
// ============================================
export default function Wallet() {

  //---State---
  const[walletBalance,setWalletBalance] = useState(DEFAULT_BALANCE);

  //---Ref--- 
  const notificationRef = useRef();

 
  //---Handler--- 
  const handledeposit=useCallback((num)=>{  
    // further use api 
    setWalletBalance(prev=> prev+num);
    notificationRef.current.showNotif('Add to credit','success')
  },[])



  return (
    <Box component="form"  sx={{ mt: 2 }}>
      {/* Balance Display */}
    <Grid sx={{ textAlign:'center',mb:3,mt:6}}>
        <Typography variant="h4" gutterBottom sx={{ mb: 1 }}>
        wallet Balance
      </Typography>
      <Typography 
        variant="h3"
        gutterBottom
        sx={{ mb: 2,mt:2, fontWeight:'bold' }}
      >
        ${walletBalance.toFixed(2)}
        </Typography>
    </Grid>

      {/* Action Button */}
      <Grid container spacing={2} >
        <div className="pass-btn">
          <Button 
              type='button'
              onClick={()=>handledeposit(20)}
              variant="contained"  
              sx={{pl:4,pr:4,mt:2,backgroundColor:'#00a859'}}
            >
              Charge
          </Button>
          
        </div>
      </Grid>
      
        <Notification ref={notificationRef}/>
    </Box>
  );
}
