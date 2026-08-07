// ✅
import React,{ useMemo } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';

import '../../../Styles/components/History.css'

// ============================================
//    Constants
// ============================================

const HISTORY_DATA=[
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
export default function History() {

  //---Memoized Values---
  const historyData = useMemo(()=> HISTORY_DATA ,[])



  return (
    <Box component="form"  sx={{ mt: 1 }}>
        <Grid container spacing={3}>
          {historyData.map((item) => (

            <Grid size={{xs:12}} key={item.id}>
                    <Card className='history-cards'>
                      <CardContent sx={{ p:2 }} className="history-cards-content">
                        <div className='history-cards-main'>
                          {/* Left Side */}
                          <div>
                            <div className='history-cards-total-amount'>
                                ${item.total}
                            </div>
                            {item.actiontype === 'withdraw' && item.orderId &&(
                                <div className='history-card-small-text'>
                                  Order ID: {item.orderId}
                                </div>
                            )}
                          </div>



                          {/* Right Side */}
                          <div className='history-card-right-section'>
                              {item.actiontype === 'deposit' ?(
                                 <DownloadIcon className='icon-deposit' />
                              ):(
                                <UploadIcon className='icon-withdraw'  />
                              )}
                              <div className='history-card-small-text' >
                                  {item.createdAt}
                              </div>
                          </div>
                        </div>
                     </CardContent>
                  </Card>
              </Grid>
          ))}
        </Grid>
    </Box>
  );
}
