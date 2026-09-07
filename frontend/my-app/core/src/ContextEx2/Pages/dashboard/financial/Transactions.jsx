import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  CircularProgress
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ReplayIcon from "@mui/icons-material/Replay";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import WalletService from "../../../Services/WalletService";
import { formatPrice } from "../../../utils/formatPrice";

import "../../../Styles/components/History.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await WalletService.getTransactions();
        const list = response.data?.results || response.data || [];
        setTransactions(list);
      } catch (err) {
        console.error("Failed loading wallet transactions:", err);
        setError("Could not load transaction history.");
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#d17842" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: "#ef5350" }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (transactions.length === 0) {
    return (
      <Box
        sx={{
          p: 6,
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px dashed rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          my: 2
        }}
      >
        <ReceiptLongIcon sx={{ fontSize: 56, color: "rgba(255, 255, 255, 0.3)", mb: 1.5 }} />
        <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
          No wallet activity yet
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
          Deposits, book purchases, and refunds made with your wallet will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="transactions-list">
      {transactions.map((tx) => {
        const isPositive = Number(tx.amount) > 0;
        const isRefund = tx.transaction_type?.toLowerCase().includes("refund");

        const icon = isRefund ? (
          <ReplayIcon sx={{ fontSize: 18 }} />
        ) : isPositive ? (
          <ArrowDownwardIcon sx={{ fontSize: 18 }} />
        ) : (
          <ArrowUpwardIcon sx={{ fontSize: 18 }} />
        );

        const badgeColor = isRefund ? "#29b6f6" : isPositive ? "#81c784" : "#ef5350";
        const badgeBg = isRefund
          ? "rgba(41, 182, 246, 0.15)"
          : isPositive
          ? "rgba(76, 175, 80, 0.15)"
          : "rgba(239, 83, 80, 0.15)";

        return (
          <Box key={tx.id} className="transaction-item-card">
            <Box className="tx-left">
              <Box
                className="tx-icon-circle"
                sx={{
                  bgcolor: badgeBg,
                  color: badgeColor,
                  border: `1px solid ${badgeColor}40`
                }}
              >
                {icon}
              </Box>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#fff" }}>
                    {tx.transaction_type_display || tx.transaction_type || "Transaction"}
                  </Typography>
                  <Chip
                    label={`#${tx.id}`}
                    size="small"
                    sx={{
                      height: "18px",
                      fontSize: "0.68rem",
                      bgcolor: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.6)"
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", display: "block", mt: 0.3 }}>
                  {new Date(tx.created_at).toLocaleDateString()} •{" "}
                  {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Typography>
                {tx.description && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      display: "block",
                      mt: 0.5,
                      fontStyle: "italic"
                    }}
                  >
                    {tx.description}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box className="tx-right">
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: isPositive ? "#81c784" : "#ef5350"
                }}
              >
                {isPositive ? "+" : "-"}
                {formatPrice(Math.abs(Number(tx.amount)))}
              </Typography>

              {tx.balance_after !== undefined && (
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", display: "block" }}>
                  Balance: {formatPrice(tx.balance_after)}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}