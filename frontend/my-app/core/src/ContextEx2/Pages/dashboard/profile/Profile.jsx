import React, { useCallback, useRef, useState } from "react";
import {
  Modal,
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SecurityIcon from "@mui/icons-material/Security";

import { useLanguage } from "../../../Context/LanguageContext";
import Accountpart from "./Accountpart";
import Passwordpart from "./Passwordpart";
import Notification from "../../../Components/feature/Notification";

import "../../../Styles/components/Profile.css";

export default function Profile({
  open,
  onClose,
  profileData,
  onProfileUpdated
}) {
  const { t } = useLanguage();
  const [value, setValue] = useState(0);
  const notificationRef = useRef(null);

  const handleTabChange = useCallback((_, newValue) => {
    setValue(newValue);
  }, []);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="profile-modal-title"
      >
        <Box
          className="mod-box profile-modal-container"
          sx={{
            background: "linear-gradient(135deg, rgba(28, 28, 30, 0.96), rgba(18, 18, 20, 0.98))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "18px",
            boxShadow: "0 28px 56px rgba(0, 0, 0, 0.7)",
            maxWidth: "750px",
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
              ⚙️ {t("dashboard.profileSecurity", "Profile & Security")}
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
              icon={<PersonOutlineIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={t("dashboard.accountDetails", "Account Details")}
            />
            <Tab
              icon={<SecurityIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={t("dashboard.securityPassword", "Security & Password")}
            />
          </Tabs>

          {/* Tab Content */}
          <Box
            sx={{
              mt: 2,
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
            {value === 0 && (
              <Accountpart
                profileData={profileData}
                onProfileUpdated={onProfileUpdated}
                notificationRef={notificationRef}
              />
            )}
            {value === 1 && (
              <Passwordpart notificationRef={notificationRef} />
            )}
          </Box>
        </Box>
      </Modal>

      <Notification ref={notificationRef} />
    </>
  );
}