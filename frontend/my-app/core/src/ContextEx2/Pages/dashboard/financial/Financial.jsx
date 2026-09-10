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
import { useLanguage } from "../../../Context/LanguageContext";

export default function Financial({ open, onClose, defaultTab = 0 }) {
  const { t } = useLanguage();
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
          background: "var(--bg-primary)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--border-color)",
          borderRadius: "18px",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.18)",
          maxWidth: "850px",
          width: "92%",
          p: { xs: 2.5, sm: 4 },
          color: "var(--text-primarys)",
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
            borderBottom: "1px solid var(--border-color)"
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: "800", color: "var(--text-primarys)", letterSpacing: "0.5px" }}
          >
            💳 {t("dashboard.financialHub", "Financial Hub")}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "var(--text-secondary)",
              "&:hover": { color: "var(--text-primarys)", bgcolor: "var(--bg-secondary)" }
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
            borderBottom: "1px solid var(--border-color)",
            "& .MuiTab-root": {
              color: "var(--text-secondary)",
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
            label={t("dashboard.walletTopup", "Wallet & Top-up")}
          />
          <Tab
            icon={<ShoppingBagIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={t("dashboard.orderHistory", "Order History")}
          />
          <Tab
            icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={t("dashboard.transactions", "Transactions")}
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
              backgroundColor: "var(--border-color)",
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
