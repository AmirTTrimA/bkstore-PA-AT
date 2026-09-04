// ✅
import React,{ useMemo,useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent
} from '@mui/material';

import {
  Typography,
  Button,
  MenuItem, 
  Menu,
  Divider,
  ListItemIcon,
} from '@mui/material'


import {
  Inventory,       
  FormatListNumbered, 
  Receipt, 
  PictureAsPdf,   
  MenuBook,
} from '@mui/icons-material';


import '../../../Styles/components/History.css'

// ============================================
//    Constants
// ============================================

const HISTORY_DATA=[
  {id:1,total:200,createdAt:'2026-05-09',orderId:"468792",status:'Pending Payment',
  items:[
    {id:1,number:'3',name:'harry-potter',type:'physical',price:'20$'},
    {id:2,number:'1',name:'long-dress-girls',type:'pdf',price:'32$'},
    {id:3,number:'2',name:'morgan joe',type:'physical',price:'10$'},
  ]
},
  {id:2,total:100,createdAt:'2022-04-023',orderId:"123456",status:'Delivered',  
  items:[
    {id:1,number:2,name:'padding css',type:'pdf',price:'40$'},
    {id:2,number:1,name:'dumb jokes',type:'physical',price:'15$'},
  ]
},
  {id:3,total:15,createdAt:'2023-01-15',orderId:"879213",status:'Cancelled',
  items:[
    {id:1,number:1,name:'paganda',type:'physical',price:'55$'},
  ]
},
  {id:4,total:30,createdAt:'2025-08-17',orderId:"123458",status:'Shipped',
  items:[
    {id:1,number:1,name:'more tnesion',type:'physical',price:'20$'},
    {id:2,number:1,name:'cyber-security',type:'pdf',price:'80$'},
    {id:3,number:1,name:'life cycle',type:'physical',price:'15$'},
    {id:4,number:2,name:'charm',type:'pdf',price:'33$'},
    {id:5,number:1,name:'nonesence',type:'pdf',price:'11$'},
  ]
},
  {id:5,total:45,createdAt:'2020-10-11',orderId:"565461",status:'Processing Order',
  items:[
    {id:1,number:2,name:'harry-potter',type:'physical',price:'20$'},
  ]
},
  {id:6,total:70,createdAt:'2026-07-07',orderId:"123457",status:'Shipped',
  items:[
    {id:1,number:4,name:'long-dress-girls',type:'pdf',price:'32$'},
    {id:2,number:1,name:'morgan joe',type:'physical',price:'10$'},
  ]
},
  {id:7,total:85,createdAt:'2026-02-08',orderId:"986312",status:'Pending Payment',
  items:[
    {id:1,number:3,name:'harry-potter',type:'physical',price:'20$'},
  ]
},
  {id:8,total:12.5,createdAt:'2024-01-05',orderId:"123439",status:'Delivered',
  items:[
    {number:3,name:'harry-potter',type:'physical',price:'20$'},
    {id:1,number:1,name:'long-dress-girls',type:'pdf',price:'32$'},
    
  ]
},
  {id:9,total:66,createdAt:'2024-02-10',orderId:"412293",status:'Processing Order',
  items:[
    {id:1,number:2,name:'harry-potter',type:'physical',price:'27$'},
    {id:2,number:2,name:'long-dress-girls',type:'pdf',price:'30$'},
    {id:3,number:2,name:'morgan joe',type:'pdf',price:'15$'},
    {id:4,number:2,name:'oxygen turn',type:'physical',price:'10$'},
  ]
},
]

// status => Pending Payment, Processing Order, Shipped , Delivered , Cancelled


// ============================================
//    Main 
// ============================================
export default function History() {

  // eslint-disable-next-line no-unused-vars
  const [anchorEl, setAnchorEl] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [submenuAnchor, setSubmenuAnchor] = useState(null);
  const [menuStates,setMenuStates] = useState([]);     // state oreder-menu




  //---Memoized Values---
  const historyData = useMemo(()=> HISTORY_DATA ,[])





// ---Handlers---


  // ---Get Menu-state for Order---
  const getMenuState = (orderId) => {
    if (!menuStates[orderId]) {
      setMenuStates(prev => ({
        ...prev,
        [orderId]: {
          anchorEl: null,
          submenuAnchor: null,
        }
      }));
    }
    return menuStates[orderId] || { anchorEl: null, submenuAnchor: null };
  };



  // ---Get Menu-state with Booleans---
  const getMenuStateWithBooleans = (orderId) => {
    const state = getMenuState(orderId);
    return {
      ...state,
      isOpen: Boolean(state.anchorEl),
      isSubmenuOpen: Boolean(state.submenuAnchor),
    };
  };




  const handleSubmenuOpen = (event, orderId) => {
    event.stopPropagation();
    setMenuStates(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        submenuAnchor: event.currentTarget,
      }
    }));
  };

  const handleSubmenuClose = (orderId) => {
    setMenuStates(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        submenuAnchor: null,
      }
    }));
  };



  const handleClose = (orderId) => {
    setMenuStates(prev => ({
      ...prev,
      [orderId]: {
        anchorEl: null,
        submenuAnchor: null,
      }
    }));
  };

    


  // ---For Specific Order---
  const handleClick = (event, orderId) => {
    setMenuStates(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        anchorEl: event.currentTarget,
      }
    }));
  };



   return (
    <Box component="form" sx={{ mt: 1 }}>
      <Grid container spacing={3}>
        {historyData.map((item) => {
          
          const { isOpen, isSubmenuOpen, anchorEl, submenuAnchor } = getMenuStateWithBooleans(item.id);
          return (
            <Grid size={{ xs: 12 }} key={item.id}>
              <Card className='history-cards'>
                <CardContent sx={{ p: 2 }} className="history-cards-content">
                  <div className='history-cards-main'>
                    {/* Left Side */}
                    <div>
                      <div className='history-cards-status'>{item.status}</div>
                      <div className='history-cards-total-amount'>${item.total}</div>
                      <div className='history-card-small-text'>Order ID: {item.orderId}</div>
                    </div>

                    {/* Right Side */}
                    <div className='history-card-right-section'>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                          onClick={(e) => handleClick(e, item.id)}
                          sx={{ textTransform: 'none', mt: 1 }}
                        >
                          detail
                        </Button>

                        {/* Menu for this order */}
                        <Menu
                          anchorEl={anchorEl}
                          open={isOpen}
                          onClose={() => handleClose(item.id)}
                          PaperProps={{
                            elevation: 2,
                            sx: { width: 250, maxWidth: '100%' }
                          }}
                        >
                          <MenuItem onClick={(e) => handleSubmenuOpen(e, item.id)}>
                            <ListItemIcon>
                              <Inventory fontSize="small" />
                            </ListItemIcon>
                            Items
                          </MenuItem>

                          <Divider />

                          <MenuItem sx={{ color: 'primary.main' }}>
                            <ListItemIcon>
                              <Receipt fontSize="small" color="primary" />
                            </ListItemIcon>
                            Total: ${item.total}
                          </MenuItem>

                          <MenuItem sx={{ color: 'primary.main' }}>
                            <ListItemIcon>
                              <FormatListNumbered fontSize="small" color="primary" />
                            </ListItemIcon>
                            Count: {item.items.length}
                          </MenuItem>

                          {/* Submenu for this order items */}
                          <Menu
                            anchorEl={submenuAnchor}
                            open={isSubmenuOpen}
                            onClose={() => handleSubmenuClose(item.id)}
                            anchorOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'left',
                            }}
                            PaperProps={{
                              sx: {
                                width: 300,
                                maxWidth: '100%',
                                maxHeight: '300px',
                              }
                            }}
                          >
                            {item.items.map((product, index) => (
                              <MenuItem
                                key={index}
                                onClick={() => handleClose(item.id)}
                                sx={{
                                  flexDirection: 'column',
                                  alignItems: 'stretch',
                                  borderBottom: '1px solid #f0f0f0',
                                  '&:last-child': { borderBottom: 'none' },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    py: 0.5,
                                    pl: 1,
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                      {product.type === 'physical' ? (
                                        <MenuBook fontSize="small" sx={{ color: '#8B4513' }} />
                                      ) : (
                                        <PictureAsPdf fontSize="small" sx={{ color: '#2196f3' }} />
                                      )}
                                    </ListItemIcon>
                                    <Typography variant="body2">
                                      {product.number}x {product.name}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" fontWeight="500">
                                    {product.price}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Menu>
                        </Menu>
                      </Box>

                      <div className='history-card-small-text'>
                        {item.createdAt}
                      </div>

                    </div>
                  </div>
                </CardContent>
              </Card>

            </Grid>
          );
        })}


      </Grid>
    </Box>
  );
}
