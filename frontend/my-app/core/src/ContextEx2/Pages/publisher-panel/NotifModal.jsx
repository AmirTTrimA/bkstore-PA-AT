// ✅
import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const getStatusColor = (status) => {
  switch (status) {
    case 'APPROVED':
    case 'APPLIED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'error';
    case 'WITHDRAWN':
      return 'default';
    default:
      return 'info';
  }
};

export default function NotifModal({ open, onClose, notifmessage = [], onWithdraw }) {
  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="notif-modal-title"
        aria-describedby="notif-modal-description"
      >
        <Box
          className="mod-box"
          sx={{
            maxHeight: '80vh',
            overflowY: 'auto',
            width: { xs: '90%', sm: 600 },
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Title */}
          <Typography
            id="notif-modal-title"
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ mb: 3, textAlign: 'center', fontWeight: '800' }}
          >
            Proposals & Notifications
          </Typography>

          {/* Notification Grid */}
          <Grid container spacing={2}>
            {notifmessage.length === 0 ? (
              <Grid item xs={12}>
                <Typography
                  variant="body1"
                  sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}
                >
                  No proposals or notifications available
                </Typography>
              </Grid>
            ) : (
              notifmessage.map((item) => {
                const isPending = item.status === 'PENDING';
                return (
                  <Grid item xs={12} key={item.id}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ pb: '16px !important' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            component="div"
                            sx={{ fontWeight: 600 }}
                          >
                            {item.title || item.msg || `Proposal #${item.id}`}
                          </Typography>
                          {item.status && (
                            <Chip
                              label={item.status_display || item.status}
                              color={getStatusColor(item.status)}
                              size="small"
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1,
                            mt: 1,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {item.proposal_type_display || item.proposal_type || 'Proposal'}
                            {item.submitted_at &&
                              ` • ${new Date(item.submitted_at).toLocaleDateString()}`}
                          </Typography>

                          {isPending && onWithdraw && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => onWithdraw(item.id)}
                              sx={{ textTransform: 'none', py: 0.2, px: 1.5 }}
                            >
                              Withdraw
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Box>
      </Modal>
    </div>
  );
}
