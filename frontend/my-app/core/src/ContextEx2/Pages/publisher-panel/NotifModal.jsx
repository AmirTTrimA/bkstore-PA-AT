// ✅
import React from 'react'
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
// style in globals.css



// ============================================
//    Main 
// ============================================
export default function NotifModal({open,onClose,notifmessage}) {

    
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
                }}
              >
                  <CloseIcon />
              </IconButton>

          {/* Title */}
          <Typography 
            variant="h4"
            component='h2' 
            gutterBottom 
            sx={{mb:3,textAlign:'center',fontWeight:'800'}}
          >
              Notifications 
          </Typography>

{/* Notification Grid */}
<Grid container spacing={3}>
          {notifmessage.length === 0 ? (
            <Grid size={12}>
              <Typography
                variant="body1"
                sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}
              >
                No notifications available
              </Typography>
            </Grid>
          ):(

  
          notifmessage.map((item) => (
          <Grid size={{xs:6}} key={item.id}>
            <Card sx={{pt:1,pl:1}}>
              <CardContent>
                <Typography gutterBottom variant="body2" component="span" >
                  {item.id}{')'} {item.msg}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
      ))
    )}
</Grid>
              
        </Box>
    </Modal>
    </div>
  )
}
