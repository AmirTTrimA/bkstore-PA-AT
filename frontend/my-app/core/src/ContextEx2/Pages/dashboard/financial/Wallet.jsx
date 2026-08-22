import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Grid,
  Typography
} from "@mui/material";

import WalletService from "../../../Services/WalletService";


// ============================================
//    Main
// ============================================

export default function Wallet() {


  const [wallet, setWallet] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  // ============================================
  // Load Wallet
  // ============================================

  useEffect(() => {


    const loadWallet = async () => {

      try {

        const response =
          await WalletService.getWallet();


        setWallet(
          response.data
        );


      }
      catch (err) {

        console.error(
          "Failed loading wallet:",
          err
        );


        setError(
          "Could not load wallet."
        );

      }
      finally {

        setLoading(false);

      }

    };


    loadWallet();


  }, []);




  // ============================================
  // States
  // ============================================


  if (loading) {

    return (

      <Box sx={{ mt: 5, textAlign: "center" }}>

        <Typography>
          Loading wallet...
        </Typography>

      </Box>

    );

  }



  if (error) {

    return (

      <Box sx={{ mt: 5, textAlign: "center" }}>

        <Typography>
          {error}
        </Typography>

      </Box>

    );

  }





  return (

    <Box
      sx={{ mt: 2 }}
    >


      {/* Balance Display */}

      <Grid
        sx={{
          textAlign: "center",
          mb: 3,
          mt: 6
        }}
      >

        <Typography
          variant="h4"
          gutterBottom
          sx={{ mb: 1 }}
        >

          Wallet Balance

        </Typography>



        <Typography

          variant="h3"

          gutterBottom

          sx={{
            mb: 2,
            mt: 2,
            fontWeight: "bold"
          }}

        >

          ${Number(wallet.balance).toFixed(2)}

        </Typography>


      </Grid>





      {/* Future wallet actions */}

      <Grid
        container
        spacing={2}
        justifyContent="center"
      >

        <Button

          type="button"

          variant="contained"

          disabled

          sx={{
            pl: 4,
            pr: 4,
            mt: 2,
            backgroundColor: "#00a859"
          }}

        >

          Charge

        </Button>


      </Grid>



    </Box>

  );

}