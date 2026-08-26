// ✅
import React, { useState,useCallback, forwardRef, useImperativeHandle } from 'react';
import { Snackbar, Alert, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';




// ============================================
//      Constants
// ============================================
const HIDE_DURATION = 2000;


// ============================================
//      Main Component
// ============================================
const Notification = forwardRef((props, ref) => {


    const navigate = useNavigate();


    // ---States---
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info');
    const [linkText, setLinkText] = useState('');
    const [linkHref, setLinkHref] = useState('');
    // eslint-disable-next-line no-unused-vars
    const [navigateTo, setNavigateTo] = useState(null)
    

    // ---Expose Methods via Ref---
    useImperativeHandle(ref, () => ({
        showNotif: (msg, type, options = {}) => {
            setMessage(msg);
            setSeverity(type);
            setLinkText(options.linkText || '');
            setLinkHref(options.linkHref || '');

            setNavigateTo(options.navigateTo);

            setOpen(true);

            if(options.navigateTo){
                setTimeout(()=>{
                    navigate(options.navigateTo);
                    setOpen(false);
                },HIDE_DURATION)
            }

            
        }
    }));

    // ---Handler---
    const handleClose = useCallback((event,reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
        setNavigateTo(null);
    },[]);

    

    return (
        <Snackbar
            open={open}
            onClose={handleClose}
            autoHideDuration={HIDE_DURATION}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
            <Alert 
                onClose={handleClose} 
                variant="filled" 
                severity={severity} 
                sx={{ width: '100%' }}
            >
                
                {linkText && (
                    <>
                        {' '}
                        <Link 
                            href={linkHref || '#'}
                            sx={{ 
                                color: 'white', 
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {linkText}
                        </Link>
                    </>
                )}
                {/* show link first for checkout */}
                {message}
            </Alert>
        </Snackbar>
    );
});

export default Notification;