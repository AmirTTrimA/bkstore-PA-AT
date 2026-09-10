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
            background: "var(--bg-primary)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-color)",
            borderRadius: "18px",
            boxShadow: "0 20px 48px rgba(0, 0, 0, 0.18)",
            maxWidth: "750px",
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
              ⚙️ {t("dashboard.profileSecurity", "Profile & Security")}
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
                backgroundColor: "var(--border-color)",
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