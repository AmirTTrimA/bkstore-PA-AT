import { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  Grid,
  TextField,
  Typography
} from "@mui/material";

import Notification from "../../../Components/feature/Notification";

import PaymentService from "../../../Services/PaymentService";
import WalletService from "../../../Services/WalletService";
import { formatPrice } from "../../../utils/formatPrice";

import "../../../Styles/components/Wallet.css";


// ============================================
//    Main
// ============================================

export default function Wallet() {


  // ============================================
  // State
  // ============================================

  const [wallet, setWallet] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");

  const [charging, setCharging] = useState(false);

  const [chargeError, setChargeError] = useState("");



  // ============================================
  // Ref
  // ============================================

  const notificationRef = useRef();




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
       * Backend created the payment.
       *
       * Wallet balance should NOT
       * be updated here.
       *
       * It will update after the
       * gateway callback succeeds.
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

    <Box
      sx={{
        mt: 2
      }}
    >


      {/* Balance */}

      <Grid
        sx={{
          textAlign: "center",
          mb: 4,
          mt: 5
        }}
      >

        <Typography
          variant="h4"
          gutterBottom
          sx={{
            mb: 1,
            fontWeight: 700
          }}
        >
          Wallet Balance
        </Typography>



        <Typography
          variant="h3"
          sx={{
            fontWeight: "bold"
          }}
        >
          {formatPrice(wallet?.balance || 0)}
        </Typography>


      </Grid>





      {/* Top Up Form */}

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
            setAmount(
              event.target.value
            )
          }
          inputProps={{
            min: 1,
            step: 1
          }}
          disabled={charging}
        />




        {
          chargeError && (

            <Typography
              color="error"
              sx={{
                mt: 1
              }}
            >
              {chargeError}
            </Typography>

          )
        }





        <Grid
          container
          justifyContent="center"
          sx={{
            mt: 2
          }}
        >

          <Button
            type="submit"
            variant="contained"
            disabled={
              charging ||
              !amount
            }
            sx={{
              px: 5,
              backgroundColor:
                "#00a859"
            }}
          >

            {
              charging
                ?
                "Redirecting..."
                :
                "Top Up"
            }


          </Button>


        </Grid>


      </Box>





      <Notification
        ref={notificationRef}
      />


    </Box>

  );

}