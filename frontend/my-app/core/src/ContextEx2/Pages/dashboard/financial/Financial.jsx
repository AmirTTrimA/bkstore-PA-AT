import React, { useState, useCallback } from "react";
import {
  Modal,
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import Wallet from "./Wallet";
import History from "./History";
import Transactions from "./Transactions";

export default function Financial({ open, onClose, defaultTab = 0 }) {
  const [value, setValue] = useState(defaultTab);

  const handleTabChange = useCallback((_, newValue) => {
    setValue(newValue);
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="financial-modal-title"
    >
      <Box
        className="mod-box mod-special"
        sx={{
          background: "linear-gradient(135deg, rgba(28, 28, 30, 0.96), rgba(18, 18, 20, 0.98))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "18px",
          boxShadow: "0 28px 56px rgba(0, 0, 0, 0.7)",
          maxWidth: "850px",
          width: "92%",
          p: { xs: 2.5, sm: 4 },
          color: "#fff",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1.5,
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: "800", color: "#fff", letterSpacing: "0.5px" }}
          >
            💳 Financial Hub
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              "&:hover": { color: "#fff", bgcolor: "rgba(255, 255, 255, 0.1)" }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={value}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            mt: 2,
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            "& .MuiTab-root": {
              color: "rgba(255, 255, 255, 0.6)",
              fontWeight: 600,
              fontSize: "0.92rem",
              textTransform: "none",
              py: 1.5,
              transition: "all 0.2s ease",
              "&.Mui-selected": {
                color: "#d17842 !important"
              }
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#d17842",
              height: 3,
              borderRadius: "3px"
            }
          }}
        >
          <Tab
            icon={<AccountBalanceWalletIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Wallet & Top-up"
          />
          <Tab
            icon={<ShoppingBagIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Order History"
          />
          <Tab
            icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Transactions"
          />
        </Tabs>

        {/* Tab Content Body */}
        <Box
          sx={{
            mt: 2.5,
            overflowY: "auto",
            flex: 1,
            pr: { xs: 0, sm: 1 },
            "&::-webkit-scrollbar": {
              width: "6px"
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              borderRadius: "3px"
            }
          }}
        >
          {value === 0 && <Wallet />}
          {value === 1 && <History />}
          {value === 2 && <Transactions />}
        </Box>
      </Box>
    </Modal>
  );
}
