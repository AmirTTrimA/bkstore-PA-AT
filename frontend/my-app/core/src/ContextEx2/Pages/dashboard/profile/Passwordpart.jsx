import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  LinearProgress,
  CircularProgress
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LockResetIcon from "@mui/icons-material/LockReset";

import UserService from "../../../Services/UserService";
import { useLanguage } from "../../../Context/LanguageContext";

const MIN_PASSWORD_LENGTH = 8;

export default function Passwordpart({ notificationRef }) {
  const { t } = useLanguage();
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    repeat_password: ""
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  // Strength validation checks
  const checks = useMemo(() => {
    const p = passwordData.new_password;
    return {
      length: p.length >= MIN_PASSWORD_LENGTH,
      uppercase: /[A-Z]/.test(p),
      lowercase: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)
    };
  }, [passwordData.new_password]);

  const strengthScore = useMemo(() => {
    const passed = Object.values(checks).filter(Boolean).length;
    return passed; // 0 to 5
  }, [checks]);

  const strengthMeta = useMemo(() => {
    if (!passwordData.new_password) {
      return { label: "", percent: 0, color: "#666" };
    }
    if (strengthScore <= 2) {
      return { label: "Weak", percent: 25, color: "#ef5350" };
    }
    if (strengthScore <= 3) {
      return { label: "Fair", percent: 50, color: "#ffa726" };
    }
    if (strengthScore === 4) {
      return { label: "Good", percent: 75, color: "#42a5f5" };
    }
    return { label: "Strong", percent: 100, color: "#66bb6a" };
  }, [passwordData.new_password, strengthScore]);

  const passwordsMatch = useMemo(() => {
    if (!passwordData.repeat_password) return true;
    return passwordData.new_password === passwordData.repeat_password;
  }, [passwordData.new_password, passwordData.repeat_password]);

  const isFormValid = useMemo(() => {
    return (
      passwordData.current_password &&
      checks.length &&
      strengthScore >= 3 &&
      passwordData.new_password === passwordData.repeat_password
    );
  }, [passwordData, checks, strengthScore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordData.current_password) {
      setError("Please enter your current password.");
      return;
    }

    if (!checks.length) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (passwordData.new_password !== passwordData.repeat_password) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      await UserService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      notificationRef.current?.showNotif?.("Password changed successfully!", "success");
      setPasswordData({
        current_password: "",
        new_password: "",
        repeat_password: ""
      });
    } catch (err) {
      console.error("Failed changing password:", err);
      const res = err.response?.data;
      const msg =
        res?.current_password?.[0] ||
        res?.new_password?.[0] ||
        res?.detail ||
        "Failed to change password. Please check your current password.";
      setError(msg);
      notificationRef.current?.showNotif?.(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primarys)", display: "flex", alignItems: "center", gap: 1 }}>
          <LockResetIcon sx={{ color: "#d17842" }} />
          {t("dashboard.changePassword", "Change Password")}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 0.5 }}>
          {t("dashboard.security", "Security & Password")}
        </Typography>
      </Box>

      {error && (
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: "8px",
            background: "rgba(239, 83, 80, 0.15)",
            border: "1px solid rgba(239, 83, 80, 0.3)",
            color: "#ef5350",
            fontSize: "0.85rem"
          }}
        >
          {error}
        </Box>
      )}

      <Grid container spacing={2}>
        {/* Current Password */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            type={showCurrent ? "text" : "password"}
            label={t("dashboard.currentPassword", "Current Password")}
            name="current_password"
            value={passwordData.current_password}
            onChange={handleChange}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowCurrent((prev) => !prev)}
                    edge="end"
                    sx={{ color: "var(--text-secondary)" }}
                  >
                    {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* New Password */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            type={showNew ? "text" : "password"}
            label={t("dashboard.newPassword", "New Password")}
            name="new_password"
            value={passwordData.new_password}
            onChange={handleChange}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowNew((prev) => !prev)}
                    edge="end"
                    sx={{ color: "var(--text-secondary)" }}
                  >
                    {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* Repeat Password */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            type={showRepeat ? "text" : "password"}
            label={t("dashboard.confirmNewPassword", "Confirm New Password")}
            name="repeat_password"
            value={passwordData.repeat_password}
            onChange={handleChange}
            size="small"
            error={!passwordsMatch}
            helperText={!passwordsMatch ? t("auth.passMismatch", "Passwords do not match.") : ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowRepeat((prev) => !prev)}
                    edge="end"
                    sx={{ color: "var(--text-secondary)" }}
                  >
                    {showRepeat ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* Password Strength Meter */}
        {passwordData.new_password && (
          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)"
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>
                  Password Strength
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: strengthMeta.color, fontWeight: 700 }}
                >
                  {strengthMeta.label}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={strengthMeta.percent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "var(--border-color)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: strengthMeta.color,
                    borderRadius: 3
                  }
                }}
              />

              {/* Checklist */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1,
                  mt: 1.5
                }}
              >
                {[
                  { key: "length", text: "8+ characters" },
                  { key: "uppercase", text: "Uppercase letter (A-Z)" },
                  { key: "lowercase", text: "Lowercase letter (a-z)" },
                  { key: "number", text: "Number (0-9)" },
                  { key: "special", text: "Special symbol (!@#$...)" }
                ].map(({ key, text }) => {
                  const passed = checks[key];
                  return (
                    <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      {passed ? (
                        <CheckCircleIcon sx={{ fontSize: 15, color: "#66bb6a" }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 15, color: "var(--text-secondary)" }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{ color: passed ? "var(--text-primarys)" : "var(--text-secondary)" }}
                      >
                        {text}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Action Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!isFormValid || saving}
          sx={{
            backgroundColor: "#d17842",
            color: "#fff",
            fontWeight: 700,
            px: 4,
            py: 1.2,
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#b35e2e" },
            "&:disabled": {
              backgroundColor: "var(--border-color)",
              color: "var(--text-secondary)"
            }
          }}
        >
          {saving ? (
            <>
              <CircularProgress size={18} sx={{ color: "#fff", mr: 1 }} />
              {t("common.saving", "Updating...")}
            </>
          ) : (
            t("dashboard.updatePassword", "Update Password")
          )}
        </Button>
      </Box>
    </Box>
  );
}