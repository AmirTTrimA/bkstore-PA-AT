import {
  useCallback,
  useEffect,
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

import "../../../Styles/components/Profile.css";



const MIN_PASSWORD_LENGTH = 8;

const PASSWORD_PATTERNS = [
  /[a-z]/,
  /[A-Z]/,
  /[0-9]/,
  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/
];




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



  const [strength, setStrength] =
    useState("none");





  useEffect(() => {


    const checkStrength = (password) => {


      if (!password) {
        return "none";
      }


      let score =
        PASSWORD_PATTERNS.reduce(
          (count, pattern) =>
            count + (pattern.test(password) ? 1 : 0),
          0
        );



      if (password.length >= MIN_PASSWORD_LENGTH) {
        score++;
      }



      if (score <= 2) {
        return "weak";
      }


      if (score <= 4) {
        return "medium";
      }


      return "strong";

    };



    setStrength(
      checkStrength(
        passwordData.new_password
      )
    );


  }, [
    passwordData.new_password
  ]);






  const handleChange = useCallback((event) => {


    const {
      name,
      value
    } = event.target;



    setPasswordData(previous => ({

      ...previous,

      [name]: value

    }));


    setError("");



  }, []);








  const handleSubmit = useCallback(
    async (event) => {


      event.preventDefault();


      if (
        passwordData.new_password.length <
        MIN_PASSWORD_LENGTH
      ) {


        const message =
          "Password must be at least 8 characters.";


        setError(message);


        notificationRef.current?.showNotif(
          message,
          "error"
        );


        return;

      }




      if (
        strength !== "strong"
      ) {


        const message =
          "Password must contain upper/lower case letters, numbers and symbols.";


        setError(message);


        notificationRef.current?.showNotif(
          message,
          "error"
        );


        return;

      }






      if (
        passwordData.new_password !==
        passwordData.repeat_password
      ) {


        const message =
          "Passwords do not match.";


        setError(message);


        notificationRef.current?.showNotif(
          message,
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
      catch(error) {


        console.error(
          "Failed changing password:",
          error
        );



        const message =

          error.response?.data?.current_password?.[0] ||

          error.response?.data?.new_password?.[0] ||

          error.response?.data?.detail ||

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
      strength,
      notificationRef
    ]
  );






  const isFormValid =

    passwordData.current_password.length > 0 &&

    passwordData.new_password.length >= MIN_PASSWORD_LENGTH &&

    passwordData.repeat_password.length >= MIN_PASSWORD_LENGTH;







  return (

    <Box

      component="form"

      onSubmit={handleSubmit}

      sx={{ mt: 1 }}

    >


      <Typography
        variant="h6"
        gutterBottom
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
            display:"flex",
            flexDirection:"column",
            alignItems:"center"
          }}
        >


          <TextField

            fullWidth

            label="Current Password"

            name="current_password"

            type="password"

            value={
              passwordData.current_password
            }

            onChange={handleChange}

            sx={{mb:2}}

            required

          />





          <TextField

            fullWidth

            label="New Password"

            name="new_password"

            type="password"

            value={
              passwordData.new_password
            }

            onChange={handleChange}

            error={!!error}

            helperText={
              error ||
              `Strength: ${strength}`
            }

            sx={{mb:2}}

            required

          />





          <TextField

            fullWidth

            label="Repeat New Password"

            name="repeat_password"

            type="password"

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
              !isFormValid ||
              saving
            }

            sx={{
              p:1.5,
              mt:2,
              backgroundColor:"red"
            }}

          >

            {
              saving
              ?
              "Updating..."
              :
              "Update Password"
            }


          </Button>


        </div>



      </Grid>


    </Box>

  );


}