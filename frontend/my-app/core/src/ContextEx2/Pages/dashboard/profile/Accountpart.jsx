import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

import UserService from "../../../Services/UserService";
import { useLanguage } from "../../../Context/LanguageContext";
import {
  ppic1, ppic2, ppic3, ppic4, ppic5, ppic6, ppic7,
  ppic8, ppic9, ppic10, ppic11, ppic12, ppic13, ppic14
} from "../../../Constants";

const AVATARS = [
  ppic1, ppic2, ppic3, ppic4, ppic5, ppic6, ppic7,
  ppic8, ppic9, ppic10, ppic11, ppic12, ppic13, ppic14
];

const MIN_USERNAME_LENGTH = 3;

export default function Accountpart({
  profileData,
  onProfileUpdated,
  notificationRef
}) {
  const { t } = useLanguage();
  const [userAccount, setUserAccount] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    job_or_major: "",
    hobbies_or_likings: ""
  });

  const [selectedAvatar, setSelectedAvatar] = useState(
    localStorage.getItem("user_avatar") || ppic14
  );
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profileData) {
      setUserAccount({
        username: profileData.username || "",
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        email: profileData.email || "",
        job_or_major: profileData.job_or_major || "",
        hobbies_or_likings: profileData.hobbies_or_likings || ""
      });
    }
  }, [profileData]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserAccount((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }, [errors]);

  const handleAvatarSelect = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    localStorage.setItem("user_avatar", avatarUrl);
    setAvatarDialogOpen(false);
    notificationRef.current?.showNotif?.("Profile avatar updated!", "success");
    // Trigger window event so dashboard avatar updates immediately
    window.dispatchEvent(new Event("avatar_updated"));
  };

  const validate = () => {
    const newErrors = {};
    const username = userAccount.username?.trim();

    if (!username) {
      newErrors.username = "Username is required.";
    } else if (username.length < MIN_USERNAME_LENGTH) {
      newErrors.username = `Username must be at least ${MIN_USERNAME_LENGTH} characters.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      notificationRef.current?.showNotif?.("Please resolve form errors.", "error");
      return;
    }

    try {
      setSaving(true);
      const data = {
        username: userAccount.username.trim(),
        first_name: userAccount.first_name.trim(),
        last_name: userAccount.last_name.trim(),
        job_or_major: userAccount.job_or_major.trim(),
        hobbies_or_likings: userAccount.hobbies_or_likings.trim()
      };

      const response = await UserService.updateProfile(data);
      onProfileUpdated?.(response.data);
      notificationRef.current?.showNotif?.("Profile information updated successfully.", "success");
    } catch (err) {
      console.error("Failed to update profile:", err);
      const res = err.response?.data;
      if (res) {
        setErrors({
          username: res.username?.[0] || "",
          first_name: res.first_name?.[0] || "",
          last_name: res.last_name?.[0] || "",
          job_or_major: res.job_or_major?.[0] || "",
          hobbies_or_likings: res.hobbies_or_likings?.[0] || ""
        });
      }
      notificationRef.current?.showNotif?.(
        res?.detail || "Failed to update profile. Please try again.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const subscription = profileData?.active_subscription;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
      {/* Avatar Header & Status */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2.5,
          p: 2,
          mb: 3,
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px"
        }}
      >
        <Box sx={{ position: "relative" }}>
          <img
            src={selectedAvatar}
            alt="Profile Avatar"
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #d17842",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)"
            }}
          />
          <IconButton
            size="small"
            onClick={() => setAvatarDialogOpen(true)}
            sx={{
              position: "absolute",
              bottom: -4,
              right: -4,
              bgcolor: "#d17842",
              color: "#fff",
              "&:hover": { bgcolor: "#b35e2e" },
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)"
            }}
            title="Choose Avatar"
          >
            <PhotoCameraIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff" }}>
            {userAccount.first_name || userAccount.last_name
              ? `${userAccount.first_name} ${userAccount.last_name}`
              : userAccount.username || "Reader"}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
            @{userAccount.username || "username"}
          </Typography>

          {subscription?.is_current && (
            <Chip
              icon={<WorkspacePremiumIcon sx={{ fontSize: "14px !important" }} />}
              label={`${subscription.plan_name} (${subscription.discount_percent}% off)`}
              size="small"
              sx={{
                mt: 1,
                bgcolor: "rgba(209, 120, 66, 0.2)",
                color: "#ffab73",
                border: "1px solid rgba(209, 120, 66, 0.4)",
                fontWeight: 700,
                fontSize: "0.72rem"
              }}
            />
          )}
        </Box>

        <Button
          variant="outlined"
          size="small"
          onClick={() => setAvatarDialogOpen(true)}
          sx={{
            color: "rgba(255, 255, 255, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.2)",
            textTransform: "none",
            "&:hover": { borderColor: "#d17842", color: "#d17842" }
          }}
        >
          {t("dashboard.changeAvatar", "Change Avatar")}
        </Button>
      </Box>

      {/* Profile Form Fields */}
      <Grid container spacing={2}>
        {/* Username */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label={t("dashboard.username", "Username")}
            name="username"
            value={userAccount.username}
            onChange={handleChange}
            error={Boolean(errors.username)}
            helperText={errors.username}
            size="small"
          />
        </Grid>

        {/* Email (Read-only) */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t("dashboard.email", "Email Address")}
            name="email"
            value={userAccount.email}
            disabled
            size="small"
            InputProps={{
              endAdornment: (
                <Chip
                  icon={<LockIcon sx={{ fontSize: "12px !important" }} />}
                  label="Verified"
                  size="small"
                  sx={{
                    height: "22px",
                    bgcolor: "rgba(76, 175, 80, 0.15)",
                    color: "#81c784",
                    fontSize: "0.68rem",
                    fontWeight: 700
                  }}
                />
              )
            }}
            helperText="Primary email cannot be changed directly."
          />
        </Grid>

        {/* First Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t("dashboard.firstName", "First Name")}
            name="first_name"
            value={userAccount.first_name}
            onChange={handleChange}
            error={Boolean(errors.first_name)}
            helperText={errors.first_name}
            placeholder="e.g. Amir"
            size="small"
          />
        </Grid>

        {/* Last Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t("dashboard.lastName", "Last Name")}
            name="last_name"
            value={userAccount.last_name}
            onChange={handleChange}
            error={Boolean(errors.last_name)}
            helperText={errors.last_name}
            placeholder="e.g. Rostami"
            size="small"
          />
        </Grid>

        {/* Job or Major */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t("dashboard.jobOrMajor", "Occupation / Major")}
            name="job_or_major"
            value={userAccount.job_or_major}
            onChange={handleChange}
            placeholder="e.g. Software Engineer, Literature Student"
            size="small"
          />
        </Grid>

        {/* Hobbies / Interests */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t("dashboard.interests", "Reading Interests & Hobbies")}
            name="hobbies_or_likings"
            value={userAccount.hobbies_or_likings}
            onChange={handleChange}
            placeholder="Tell us about the genres, topics, or authors you love..."
            size="small"
          />
        </Grid>
      </Grid>

      {/* Action Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          sx={{
            backgroundColor: "#d17842",
            color: "#fff",
            fontWeight: 700,
            px: 4,
            py: 1.2,
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#b35e2e" }
          }}
        >
          {saving ? (
            <>
              <CircularProgress size={18} sx={{ color: "#fff", mr: 1 }} />
              {t("common.saving", "Saving...")}
            </>
          ) : (
            t("dashboard.saveChanges", "Save Changes")
          )}
        </Button>
      </Box>

      {/* Avatar Picker Dialog */}
      <Dialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        PaperProps={{
          sx: {
            background: "#1e1e20",
            color: "#fff",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            maxWidth: "520px",
            width: "90%",
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("dashboard.avatarDialogTitle", "Choose Profile Avatar")}
          </Typography>
          <IconButton size="small" onClick={() => setAvatarDialogOpen(false)} sx={{ color: "#aaa" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
              gap: 2,
              py: 1
            }}
          >
            {AVATARS.map((avatar, idx) => {
              const isSelected = selectedAvatar === avatar;
              return (
                <Box
                  key={idx}
                  onClick={() => handleAvatarSelect(avatar)}
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: isSelected ? "3px solid #d17842" : "2px solid transparent",
                    boxShadow: isSelected ? "0 0 12px rgba(209, 120, 66, 0.6)" : "none",
                    transition: "all 0.2s ease",
                    "&:hover": { transform: "scale(1.08)", borderColor: "#d17842" }
                  }}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${idx + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  {isSelected && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        bgcolor: "rgba(209, 120, 66, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <CheckCircleIcon sx={{ color: "#fff", fontSize: 24 }} />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}