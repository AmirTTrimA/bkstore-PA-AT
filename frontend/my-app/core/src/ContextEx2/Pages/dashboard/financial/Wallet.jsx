// ✅
import React,{ useState,useRef,useCallback,useMemo } from 'react'
import {
  Box,
  Button,
  Grid,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import Notification from '../../../Components/feature/Notification';

import '../../../Styles/components/Wallet.css'

// ============================================
//    Constants
// ============================================
const DEFAULT_BALANCE = 0;

const WALLET_DATA=[
  {id:1,total:200,actiontype:'withdraw',createdAt:'2026-05-09',orderId:"123456"},
  {id:2,total:100,actiontype:'deposite',createdAt:'2022-04-023'},
  {id:3,total:15,actiontype:'deposit',createdAt:'2023-01-15'},
  {id:4,total:30,actiontype:'withdraw',createdAt:'2025-08-17',orderId:"123458"},
  {id:5,total:45,actiontype:'deposit',createdAt:'2020-10-11'},
  {id:6,total:70,actiontype:'withdraw',createdAt:'2026-07-07',orderId:"123457"},
  {id:7,total:85,actiontype:'deposit',createdAt:'2026-02-08'},
  {id:8,total:12.5,actiontype:'withdraw',createdAt:'2024-01-05',orderId:"123439"},
  {id:9,total:66,actiontype:'deposit',createdAt:'2024-02-10'},
]


// ============================================
//    Main
// ============================================
export default function Wallet() {

  //---State---
  const[walletBalance,setWalletBalance] = useState(DEFAULT_BALANCE);
  

  //---Memoized Values---
  const walletData = useMemo(()=> WALLET_DATA ,[])

  //---Ref--- 
  const notificationRef = useRef();

 
  //---Handler--- 
  const handledeposit=useCallback((num)=>{  
    // further use api 
    setWalletBalance(prev=> prev+num);
    notificationRef.current.showNotif('Add to credit','success')
  },[])



  return (
    <Box 
      component="form"
      sx={{ 
        mt: 2,
        display: 'flex',          
        flexDirection: 'column',
      }}
    >

{/* Top Section (Balance) */}
    <Grid 
      sx={{
        position:'sticky',
        top:0,
        textAlign:'center',
        mb:3,
        zIndex:1,
        backgroundColor: '#ffffff',
        paddingBottom: 2,       
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderRadius: '0 0 8px 8px',
        }}
    >
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
    

      {/* Action Button */}
        <div className="pass-btn"> 
          <Button 
            type='button'
            onClick={()=>handledeposit(20)}
            variant="contained"  
            sx={{pl:4,pr:4,mt:1,backgroundColor:'#00a859'}}
          >
            Charge
          </Button>   
        </div>
    </Grid>


{/* Bottom Section */}  
      <Grid container spacing={3}  >
          {walletData.map((item) => (
            <Grid size={{xs:12}} key={item.id}>
                    <Card className='wallet-cards'>
                      <CardContent sx={{ p:2 }} className="wallet-cards-content">
                        <div className='wallet-cards-main'>
                          {/* Left Side */}
                          <div>
                            <div className='wallet-cards-total-amount'>
                                ${item.total}
                            </div>
                          </div>


                          {/* Right Side */}
                          <div className='wallet-card-right-section'>
                              {item.actiontype === 'deposit' ? (
                                 <DownloadIcon className='icon-deposit' />
                              ):(
                                <UploadIcon className='icon-withdraw'  />
                              )}
                              <div className='wallet-card-small-text' >
                                  {item.createdAt}
                              </div>
                          </div>
                        </div>
                     </CardContent>
                  </Card>
              </Grid>
          ))}
        </Grid>



        <Notification ref={notificationRef}/>
    </Box>
  );
}
