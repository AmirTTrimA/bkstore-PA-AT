// ✅
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Box, Button, Typography, Card, CardContent, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NewAddresses from './NewAddresses';
// style in Profile.css


// ============================================
//    Main 
// ============================================
export default function Addresses() {

  // ---State---
  const [addmodal, setAddModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [editingaddress, setEditingAddress] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);



  // ---Memoized Values---
  const hasAddresses = useMemo(() => addresses.length > 0, [addresses]);



// ---Effects---

  // Load addresses
  useEffect(() => {
    const savedAddresses = localStorage.getItem('user-addresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    }
  }, []);



//---Helper Functions---
  const saveAddressesToLocal = (newAddresses) => {
    localStorage.setItem('user-addresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };


// ---Handlers---
  const handleEditAddress = useCallback((address) => {
    setEditingAddress(address);
    setAddModal(true);
    handleMenuClose(); 
  },[])

  const handleDeleteAddress = useCallback((id) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    saveAddressesToLocal(updatedAddresses);
    handleMenuClose(); 
  },[addresses])


  const handleAddModalOpen = () => {
    setAddModal(true);
  }
  
  const handleAddModalClose = () => {
    setEditingAddress(null);
    setAddModal(false);
  }

  const handleMenuOpen = useCallback((event, address) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAddress(address);
  },[])

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAddress(null);
  };

  // Handle save address (add/edit)
  const handleSaveAddress = (addressData, isEditing, editingId) => {
    if (isEditing) {
      // Update existing address
      const updatedAddresses = addresses.map(addr => 
        addr.id === editingId 
          ? { ...addr, ...addressData, updatedAt: new Date().toISOString() } 
          : addr
      );
      saveAddressesToLocal(updatedAddresses);
    } else {
      
      const newAddress = {
        ...addressData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      const updatedAddresses = [...addresses, newAddress];
      saveAddressesToLocal(updatedAddresses);
    }

  };

  return (
    <Box sx={{ 
      margin: '0 auto',     
      px: { xs:0, sm: 3, md: 4 }  
    }}>
      {/* Header */}
      <Typography 
        variant="h6"
        gutterBottom
        className="account-pic" 
      >
        Choose Address
      </Typography>
      
      {/* Add Button */}
      <Button
        type='button' 
        onClick={handleAddModalOpen}
        sx={{ mb: 3 }}
      >
        + New Address
      </Button>

      {/* Address Cards */}
      <div className='addresses-container'>
        {!hasAddresses ? (
          <div className='addresses-empty-state'>
            No Address yet
          </div>
        ) : (
          addresses.map((address) => (
            <Card 
              key={address.id}
              sx={{ 
                position: 'relative',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: '700', 
                    color: 'black',
                    fontSize: '1.3rem'
                  }}>
                    {address.recivername}
                  </Typography>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, address)}
                    sx={{
                      color: '#666',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Province & City Chip */}
                <Box sx={{ 
                  display: 'inline-flex',
                  backgroundColor: 'green',
                  borderRadius: '16px',
                  px: 1.5,
                  py: 0.5,
                  mb: 2,
                  fontSize: '0.75rem',
                  color: 'white'
                }}>
                  {address.province}-{address.city}
                </Box>
                
                {/* Address details */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <LocationOnIcon fontSize="small" sx={{ color: '#757575', fontSize: '1rem' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {address.address}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <PhoneIcon fontSize="small" sx={{ color: '#757575', fontSize: '1rem' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {address.phone}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocalShippingIcon fontSize="small" sx={{ color: '#757575', fontSize: '1rem' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Postal Code: {address.postcode}
                  </Typography>
                </Box>

                {/* Plate number */}
                  <Box sx={{ 
                    mt: 1.5,
                    pt: 1,
                    borderTop: '1px solid #f0f0f0',
                    fontSize: '0.75rem',
                    color: '#999'
                  }}>
                    Plate Number: {address.platenum}
                  </Box>
                
              </CardContent>

              {/* Dropdown-Menu(del/edit) */}
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor) && selectedAddress?.id === address.id}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: {
                    minWidth: '150px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    borderRadius: 1
                  }
                }}
              >
                <MenuItem onClick={() => handleEditAddress(selectedAddress)} sx={{ gap: 1 }}>
                  <EditIcon fontSize="small" sx={{ color: '#1976d2' }} />
                  <Typography variant="body2"> edit </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleDeleteAddress(selectedAddress?.id)} sx={{ gap: 1 }}>
                  <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
                  <Typography variant="body2"> delete </Typography>
                </MenuItem>
              </Menu>
            </Card>
          ))
        )}
      </div>

      {/* New Address Modal */}
      {addmodal && 
        <NewAddresses 
          open={addmodal}
          onClose={handleAddModalClose}
          onSave={handleSaveAddress}
          editingAddress={editingaddress}
        />
      }
    </Box>
  );
}