import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  Box,
  IconButton,
  Modal,
  Tab,
  Tabs,
  Typography
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import Notification from "../../../Components/feature/Notification";
import Accountpart from "./Accountpart";
import Passwordpart from "./Passwordpart";

import UserService from "../../../Services/UserService";

import "../../../Styles/components/Profile.css";


// ============================================
// Main
// ============================================

export default function Profile({ open, onClose }) {

  const notificationRef = useRef(null);


  // ==============================
  // State
  // ==============================

  const [value, setValue] = useState(0);

  const [profileData, setProfileData] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");



  // ==============================
  // Load Profile
  // ==============================

  const loadProfile = useCallback(async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await UserService.getProfile();

      setProfileData(response.data);

    }
    catch (err) {

      console.error(
        "Failed to load profile:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Failed to load profile."
      );

    }
    finally {

      setLoading(false);

    }

  }, []);



  // ==============================
  // Effects
  // ==============================

  useEffect(() => {

    if (open) {
      loadProfile();
    }

  }, [open, loadProfile]);



  // ==============================
  // Handlers
  // ==============================

  const handleTabChange = useCallback(
    (_, newValue) => {
      setValue(newValue);
    },
    []
  );



  const handleProfileUpdated = useCallback(
    (updatedProfile) => {

      setProfileData(updatedProfile);

    },
    []
  );



  // ==============================
  // Render
  // ==============================

  return (

    <div>

      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="profile-modal-title"
        aria-describedby="profile-modal-description"
      >

        <Box className="mod-box">

          {/* Close Button */}

          <IconButton
            onClick={onClose}
            sx={{
              mt: 0.2,
              p: 0.2,
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.04)"
              }
            }}
          >
            <CloseIcon />
          </IconButton>



          {/* Title */}

          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              mb: 2,
              textAlign: "center",
              fontWeight: "800"
            }}
          >
            Edit Profile
          </Typography>



          {/* Tabs */}

          <Tabs
            value={value}
            onChange={handleTabChange}
            aria-label="setting navigation tabs"
            variant="fullWidth"
            sx={{
              borderBottom: 2,
              borderColor: "divider",
              mb: 1,
              mt: 2,

              "& .Mui-selected": {
                color: "red !important"
              },

              "& .MuiTabs-indicator": {
                backgroundColor: "red"
              }
            }}
          >

            <Tab label="Account" />

            <Tab label="Password" />

          </Tabs>



          {/* Content */}

          <Box
            p={3}
            border={1}
            borderColor="grey.200"
            borderRadius={1}
          >

            {loading && (
              <Typography>
                Loading profile...
              </Typography>
            )}


            {!loading && error && (
              <Typography color="error">
                {error}
              </Typography>
            )}


            {!loading && !error && profileData && (

              <>
                {value === 0 && (
                  <Accountpart
                    profileData={profileData}
                    onProfileUpdated={handleProfileUpdated}
                    notificationRef={notificationRef}
                  />
                )}


                {value === 1 && (
                  <Passwordpart
                    notificationRef={notificationRef}
                  />
                )}
              </>

            )}

          </Box>

        </Box>

      </Modal>



      <Notification
        ref={notificationRef}
      />

    </div>

  );
}