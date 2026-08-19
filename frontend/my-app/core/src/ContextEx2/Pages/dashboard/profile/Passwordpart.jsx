import {
  useCallback,
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
// Main
// ============================================

export default function Passwordpart({
  notificationRef
}) {


  const [passwordData, setPasswordData] =
    useState({
      current_password: "",
      new_password: "",
      repeat_password: ""
    });


  const [saving, setSaving] =
    useState(false);


  const [error, setError] =
    useState("");



  const handleChange = useCallback((e) => {

    const {
      name,
      value
    } = e.target;

    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    setError("");

  }, []);



  const handleSubmit = useCallback(
    async (e) => {

      e.preventDefault();


      if (
        passwordData.new_password !==
        passwordData.repeat_password
      ) {

        setError(
          "New passwords do not match."
        );

        notificationRef.current?.showNotif(
          "Passwords do not match.",
          "error"
        );

        return;

      }


      try {

        setSaving(true);


        await UserService.changePassword({
          current_password:
            passwordData.current_password,

          new_password:
            passwordData.new_password
        });


        notificationRef.current?.showNotif(
          "Password changed successfully.",
          "success"
        );


        setPasswordData({
          current_password: "",
          new_password: "",
          repeat_password: ""
        });

      }
      catch (err) {

        console.error(
          "Failed to change password:",
          err
        );


        const data =
          err.response?.data;


        const message =
          data?.current_password?.[0] ||
          data?.new_password?.[0] ||
          data?.detail ||
          "Failed to change password.";


        setError(message);


        notificationRef.current?.showNotif(
          message,
          "error"
        );

      }
      finally {

        setSaving(false);

      }

    },
    [
      passwordData,
      notificationRef
    ]
  );



  const isFormValid =
    passwordData.current_password.length > 0 &&
    passwordData.new_password.length >= 8 &&
    passwordData.repeat_password.length >= 8;



  return (

    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ mt: 1 }}
    >

      <Typography
        variant="h6"
        gutterBottom
        sx={{ mb: 2 }}
      >
        Change Password
      </Typography>



      <Grid
        container
        spacing={2}
      >

        <Grid
          size={12}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >

          <TextField
            fullWidth
            label="Current Password"
            name="current_password"
            type="password"
            className="customTextField"
            value={
              passwordData.current_password
            }
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
          />


          <TextField
            fullWidth
            label="New Password"
            name="new_password"
            type="password"
            className="customTextField"
            value={
              passwordData.new_password
            }
            onChange={handleChange}
            sx={{ mb: 2 }}
            error={!!error}
            helperText={error}
            required
          />


          <TextField
            fullWidth
            label="Repeat New Password"
            name="repeat_password"
            type="password"
            className="customTextField"
            value={
              passwordData.repeat_password
            }
            onChange={handleChange}
            required
          />

        </Grid>



        <div className="pass-btn">

          <Button
            type="submit"
            variant="contained"
            disabled={
              !isFormValid || saving
            }
            sx={{
              p: 1.5,
              mt: 2,
              backgroundColor: "red"
            }}
          >

            {saving
              ? "Updating..."
              : "Update Password"}

          </Button>

        </div>

      </Grid>

    </Box>

  );

}