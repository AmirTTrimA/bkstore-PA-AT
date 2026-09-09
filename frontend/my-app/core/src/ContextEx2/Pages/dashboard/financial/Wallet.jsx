import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Alert
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddCardIcon from "@mui/icons-material/AddCard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import Notification from "../../../Components/feature/Notification";
import PaymentService from "../../../Services/PaymentService";
import WalletService from "../../../Services/WalletService";
import { useLanguage } from "../../../Context/LanguageContext";
import { formatPrice } from "../../../utils/formatPrice";

import "../../../Styles/components/Wallet.css";

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000];

export default function Wallet() {
  const { t } = useLanguage();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState("");

  const notificationRef = useRef();

  const loadWallet = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await WalletService.getWallet();
      setWallet(response.data);
    } catch (err) {
      console.error("Failed loading wallet:", err);
      setError("Could not retrieve wallet balance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleSelectPreset = (preset) => {
    setAmount(String(preset));
    setChargeError("");
  };

  const handleTopUp = async (event) => {
    event.preventDefault();
    setChargeError("");

    const numericAmount = Number(amount);

    if (!Number.isInteger(numericAmount) || numericAmount < 1000) {
      setChargeError("Minimum top-up amount is 1,000 IRR.");
      return;
    }

    try {
      setCharging(true);
      const response = await PaymentService.chargeWallet(numericAmount);
      const paymentUrl = response.data?.payment_url;

      if (paymentUrl) {
        notificationRef.current?.showNotif?.("Redirecting to payment gateway...", "info");
        window.location.href = paymentUrl;
      } else {
        notificationRef.current?.showNotif?.("Wallet charged successfully!", "success");
        setAmount("");
        await loadWallet();
      }
    } catch (err) {
      console.error("Failed charging wallet:", err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.amount?.[0] ||
        "Payment initiation failed. Please try again.";
      setChargeError(msg);
      notificationRef.current?.showNotif?.(msg, "error");
    } finally {
      setCharging(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#d17842" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={loadWallet}>
            Retry
          </Button>
        }
        sx={{ my: 2 }}
      >
        {error}
      </Alert>
    );
  }

  const currentBalance = wallet?.balance ?? 0;

  return (
    <Box className="wallet-hub-container">
      {/* Virtual Wallet Card */}
      <Box className="virtual-wallet-card">
        <Box className="card-top-row">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 28, color: "#d17842" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              {t("dashboard.walletCardTitle", "BOOKSTORE WALLET")}
            </Typography>
          </Box>
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
            label={t("common.status_active", "Active")}
            size="small"
            sx={{
              bgcolor: "rgba(76, 175, 80, 0.2)",
              color: "#81c784",
              border: "1px solid rgba(76, 175, 80, 0.4)",
              fontWeight: 700
            }}
          />
        </Box>

        <Box className="card-balance-section">
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase" }}>
            {t("dashboard.availableBalance", "Available Balance")}
          </Typography>
          <Typography variant="h4" className="balance-value">
            {formatPrice(currentBalance)}
          </Typography>
        </Box>

        <Box className="card-bottom-row">
          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
            {t("dashboard.walletOwner", "Owner: {name}", { name: wallet?.user || "Valued Reader" })}
          </Typography>
          {wallet?.updated_at && (
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.4)" }}>
              {t("dashboard.walletUpdated", "Updated {date}", { date: new Date(wallet.updated_at).toLocaleDateString() })}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Top-up Form Section */}
      <Box className="wallet-deposit-section" component="form" onSubmit={handleTopUp}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <AddCardIcon sx={{ color: "#d17842" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("dashboard.topUpWallet", "Top-up Wallet")}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", mb: 2 }}>
          {t("dashboard.topUpSubtitle", "Choose a quick deposit preset or enter any custom amount in IRR.")}
        </Typography>

        {/* Presets */}
        <Box className="presets-container">
          {PRESET_AMOUNTS.map((preset) => {
            const isSelected = Number(amount) === preset;
            return (
              <Button
                key={preset}
                type="button"
                variant={isSelected ? "contained" : "outlined"}
                onClick={() => handleSelectPreset(preset)}
                className={`preset-btn ${isSelected ? "selected" : ""}`}
                sx={{
                  color: isSelected ? "#fff" : "rgba(255, 255, 255, 0.8)",
                  borderColor: isSelected ? "#d17842" : "rgba(255, 255, 255, 0.15)",
                  bgcolor: isSelected ? "#d17842 !important" : "rgba(255, 255, 255, 0.03)",
                  "&:hover": {
                    borderColor: "#d17842",
                    bgcolor: "rgba(209, 120, 66, 0.15)"
                  }
                }}
              >
                +{formatPrice(preset)}
              </Button>
            );
          })}
        </Box>

        {/* Custom Input */}
        <Box sx={{ mt: 2.5 }}>
          <TextField
            fullWidth
            type="number"
            label={t("dashboard.customAmount", "Deposit Amount (IRR)")}
            placeholder="e.g. 200000"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setChargeError("");
            }}
            error={Boolean(chargeError)}
            helperText={chargeError || (amount ? `Will add ${formatPrice(Number(amount))} to your wallet.` : "")}
            size="small"
            InputProps={{
              startAdornment: (
                <Typography sx={{ color: "rgba(255,255,255,0.4)", mr: 1, fontSize: "0.9rem" }}>
                  {t("common.irr", "IRR")}
                </Typography>
              )
            }}
          />
        </Box>

        {/* Top-up Action */}
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={charging || !amount || Number(amount) < 1000}
            sx={{
              backgroundColor: "#d17842",
              color: "#fff",
              fontWeight: 700,
              px: 4,
              py: 1.2,
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#b35e2e" },
              "&:disabled": { backgroundColor: "rgba(255, 255, 255, 0.12)", color: "rgba(255, 255, 255, 0.3)" }
            }}
          >
            {charging ? (
              <>
                <CircularProgress size={18} sx={{ color: "#fff", mr: 1 }} />
                {t("dashboard.processingGateway", "Processing...")}
              </>
            ) : (
              t("dashboard.depositViaGateway", "Deposit via Gateway")
            )}
          </Button>
        </Box>
      </Box>

      <Notification ref={notificationRef} />
    </Box>
  );
}