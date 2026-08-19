import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Box,
  Button,
  Grid,
  TextField,
  Typography
} from "@mui/material";

import UserService from "../../../Services/UserService";


// ============================================
// Constants
// ============================================

const MIN_USERNAME_LENGTH = 3;


// ============================================
// Main
// ============================================

export default function Accountpart({
  profileData,
  onProfileUpdated,
  notificationRef
}) {


  // ==============================
  // State
  // ==============================

  const [userAccount, setUserAccount] = useState({
    username: profileData?.username || "",
    job_or_major: profileData?.job_or_major || "",
    hobbies_or_likings:
      profileData?.hobbies_or_likings || ""
  });


  const [errors, setErrors] = useState({
    username: "",
    job_or_major: "",
    hobbies_or_likings: ""
  });


  const [saving, setSaving] = useState(false);



  // ==============================
  // Sync with backend profile
  // ==============================

  useEffect(() => {

    setUserAccount({
      username: profileData?.username || "",
      job_or_major: profileData?.job_or_major || "",
      hobbies_or_likings:
        profileData?.hobbies_or_likings || ""
    });

  }, [profileData]);



  // ==============================
  // Validation
  // ==============================

  const isFormValid = useMemo(() => {

    const username =
      userAccount.username?.trim();

    return (
      username &&
      username.length >= MIN_USERNAME_LENGTH
    );

  }, [userAccount.username]);



  // ==============================
  // Handlers
  // ==============================

  const handleChange = useCallback((e) => {

    const {
      name,
      value
    } = e.target;

    setUserAccount(prev => ({
      ...prev,
      [name]: value
    }));


    setErrors(prev => ({
      ...prev,
      [name]: ""
    }));

  }, []);



  const validate = useCallback(() => {

    const newErrors = {
      username: "",
      job_or_major: "",
      hobbies_or_likings: ""
    };

    let valid = true;


    const username =
      userAccount.username?.trim();


    if (!username) {

      newErrors.username =
        "Username is required.";

      valid = false;

    }
    else if (
      username.length < MIN_USERNAME_LENGTH
    ) {

      newErrors.username =
        `Username must be at least ${MIN_USERNAME_LENGTH} characters.`;

      valid = false;

    }


    setErrors(newErrors);

    return valid;

  }, [userAccount]);



  const handleSubmit = useCallback(
    async (e) => {

      e.preventDefault();


      if (!validate()) {

        notificationRef.current?.showNotif(
          "Please fix the errors.",
          "error"
        );

        return;

      }


      try {

        setSaving(true);


        const data = {
          username:
            userAccount.username.trim(),

          job_or_major:
            userAccount.job_or_major.trim(),

          hobbies_or_likings:
            userAccount.hobbies_or_likings.trim()
        };


        const response =
          await UserService.updateProfile(data);


        onProfileUpdated(response.data);


        notificationRef.current?.showNotif(
          "Account information updated.",
          "success"
        );

      }
      catch (err) {

        console.error(
          "Failed to update profile:",
          err
        );


        const responseData =
          err.response?.data;


        if (responseData) {

          setErrors(prev => ({
            ...prev,

            username:
              responseData.username?.[0] ||
              "",

            job_or_major:
              responseData.job_or_major?.[0] ||
              "",

            hobbies_or_likings:
              responseData.hobbies_or_likings?.[0] ||
              ""
          }));

        }


        notificationRef.current?.showNotif(
          responseData?.detail ||
          "Failed to update profile.",
          "error"
        );

      }
      finally {

        setSaving(false);

      }

    },
    [
      userAccount,
      validate,
      notificationRef,
      onProfileUpdated
    ]
  );



  // ==============================
  // Render
  // ==============================

  return (

    <Box
      component="form"
      onSubmit={handleSubmit}
    >

      <Typography
        variant="h6"
        gutterBottom
        className="account-pic"
      >
        Account Details
      </Typography>



      <Grid
        container
        spacing={2}
        sx={{ mt: 2 }}
      >

        <Grid size={12}>

          <TextField
            fullWidth
            label="Username"
            name="username"
            className="customTextField"
            value={userAccount.username}
            onChange={handleChange}
            sx={{ mb: 2 }}
            error={!!errors.username}
            helperText={errors.username}
            required
          />


          <TextField
            fullWidth
            label="Job / Major"
            name="job_or_major"
            className="customTextField"
            value={userAccount.job_or_major}
            onChange={handleChange}
            sx={{ mb: 2 }}
            error={!!errors.job_or_major}
            helperText={errors.job_or_major}
          />


          <TextField
            fullWidth
            label="Hobbies / Interests"
            name="hobbies_or_likings"
            className="customTextField"
            value={
              userAccount.hobbies_or_likings
            }
            onChange={handleChange}
            multiline
            minRows={3}
            error={
              !!errors.hobbies_or_likings
            }
            helperText={
              errors.hobbies_or_likings
            }
          />

        </Grid>

      </Grid>



      <Button
        type="submit"
        variant="contained"
        className="save-btn"
        disabled={!isFormValid || saving}
        sx={{
          p: 1.5,
          mt: 2,
          backgroundColor: "red"
        }}
      >

        {saving
          ? "Saving..."
          : "Save Changes"}

      </Button>

    </Box>

  );

}