import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Grid,
  TextField,
  Typography
} from "@mui/material";

import PaymentService from "../../../Services/PaymentService";
import WalletService from "../../../Services/WalletService";


// ============================================
//    Main
// ============================================

export default function Wallet() {

  const [wallet, setWallet] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");

  const [charging, setCharging] = useState(false);

  const [chargeError, setChargeError] = useState("");


  // ============================================
  // Load Wallet
  // ============================================

  const loadWallet = async () => {

    try {

      const response =
        await WalletService.getWallet();

      setWallet(response.data);

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


  useEffect(() => {

    loadWallet();

  }, []);


  // ============================================
  // Top Up
  // ============================================

  const handleTopUp = async (event) => {

    event.preventDefault();

    setChargeError("");


    const numericAmount =
      Number(amount);


    if (
      !Number.isInteger(numericAmount) ||
      numericAmount < 1
    ) {

      setChargeError(
        "Please enter a valid amount in IRR."
      );

      return;

    }


    try {

      setCharging(true);


      const response =
        await PaymentService.chargeWallet(
          numericAmount
        );


      const paymentUrl =
        response.data?.payment_url;


      if (!paymentUrl) {

        throw new Error(
          "Payment URL was not returned."
        );

      }


      /*
       * The backend has created the payment
       * and returned the gateway redirect.
       *
       * Do not update the wallet locally.
       * The backend will credit it only after
       * successful gateway verification.
       */

      window.location.href =
        paymentUrl;

    }
    catch (err) {

      console.error(
        "Wallet top-up failed:",
        err
      );


      setChargeError(
        err.response?.data?.detail ||
        "Could not start the payment."
      );

      setCharging(false);

    }

  };


  // ============================================
  // States
  // ============================================

  if (loading) {

    return (

      <Box
        sx={{
          mt: 5,
          textAlign: "center"
        }}
      >

        <Typography>
          Loading wallet...
        </Typography>

      </Box>

    );

  }


  if (error) {

    return (

      <Box
        sx={{
          mt: 5,
          textAlign: "center"
        }}
      >

        <Typography>
          {error}
        </Typography>

      </Box>

    );

  }


  // ============================================
  // Render
  // ============================================

  return (

    <Box sx={{ mt: 2 }}>


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

          {Number(wallet.balance).toLocaleString("fa-IR")}

          {" "}

          IRR

        </Typography>

      </Grid>



      {/* Top Up */}

      <Box
        component="form"
        onSubmit={handleTopUp}
      >

        <TextField

          fullWidth

          label="Amount (IRR)"

          type="number"

          value={amount}

          onChange={(event) =>
            setAmount(event.target.value)
          }

          inputProps={{
            min: 1,
            step: 1
          }}

          disabled={charging}

        />


        {chargeError && (

          <Typography
            color="error"
            sx={{ mt: 1 }}
          >
            {chargeError}
          </Typography>

        )}


        <Grid
          container
          spacing={2}
          justifyContent="center"
        >

          <Button

            type="submit"

            variant="contained"

            disabled={
              charging ||
              !amount
            }

            sx={{
              pl: 4,
              pr: 4,
              mt: 2,
              backgroundColor: "#00a859"
            }}

          >

            {charging
              ? "Redirecting..."
              : "Top Up"
            }

          </Button>

        </Grid>

      </Box>


    </Box>

  );

}