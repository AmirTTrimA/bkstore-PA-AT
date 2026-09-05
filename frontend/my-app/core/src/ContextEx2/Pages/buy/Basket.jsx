import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";

import BasketService from "../../Services/BasketService";

import Notification from "../../Components/feature/Notification";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Basket.css";


export default function Basket() {


  const navigate = useNavigate();

  const { isLoggedIn } = useAuth();

  const notificationRef = useRef();



  // ==============================
  // State
  // ==============================

  const [cartItems, setCartItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [hasSavedAddress, setHasSavedAddress] = useState(false);


  // ==============================
  // Load Basket
  // ==============================

  useEffect(() => {


    const loadBasket = async () => {

      try {

        const response =
          await BasketService.getBasket();


        setCartItems(
          response.data
        );


      } catch (err) {

        console.error(
          "Failed loading basket:",
          err
        );

        setError(
          "Failed to load basket."
        );

      }
      finally {

        setLoading(false);

      }

    };


    loadBasket();


  }, []);





  // ==============================
  // Address Check
  // ==============================

  useEffect(() => {
    setHasSavedAddress(false);
  }, []);





  // ==============================
  // Helpers
  // ==============================


  const isEmpty =
    cartItems.length === 0;



  const hasPhysicalBook =
    cartItems.some(
      item =>
        item.format_type
          ?.toLowerCase()
          .includes("physical")
    );



  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.subtotal),
    0
  );

  const total = subtotal;

  // ==============================
  // Remove Item
  // ==============================

  const removeItems = async (item) => {

    try {

      await BasketService.removeItem({
        book_id: item.book_id,
        format_id: item.format_id
      });


      const response =
        await BasketService.getBasket();


      setCartItems(response.data);


    } catch (err) {

      console.error(err);

    }

  };





  // ==============================
  // Quantity
  // ==============================

  const setQuantity = async (
    item,
    quantity
  ) => {


    if (quantity < 1)
      return;



    try {


      await BasketService.setQuantity({

        book_id: item.book_id,

        format_id: item.format_id,

        quantity

      });



      const response =
        await BasketService.getBasket();



      setCartItems(
        response.data
      );


    }
    catch (err) {

      console.error(err);

    }


  };







  // ==============================
  // Checkout
  // ==============================


  const handleCheckout = () => {


    if (!isLoggedIn) {

      notificationRef.current.showNotif(
        "Login required",
        "error",
        {
          linkText: "login",
          linkHref: "/login"
        }
      );


      return;

    }



    navigate(
      "/checkout",
      {
        state: {

          cartItems,

          total,

          subtotal,

          hassavedaddress:
            hasSavedAddress,

          startAtStep:
            hasPhysicalBook && !hasSavedAddress
              ? 1
              : 2

        }
      }
    );


  };






  // ==============================
  // Render
  // ==============================


  if (loading) {

    return (
      <div className="basket-container">
        Loading basket...
      </div>
    );

  }



  if (error) {

    return (
      <div className="basket-container">
        {error}
      </div>
    );

  }





  return (

    <div className="basket-container">


      {
        isEmpty ? (

          <div className="empty-state">


            <h3>
              Your basket is empty
            </h3>


            <p>
              Explore our collection and find something you love!
            </p>


            <button
              className="shop-button"
              onClick={() =>
                navigate("/home")
              }
            >
              Back to Shop
            </button>


          </div>


        )
          :
          (


            <div className="cart-list">


              <h2>
                Shopping Basket ({cartItems.length})
              </h2>



              <div className="cart-items">


                {
                  cartItems.map(item => (


                    <div
                      key={`${item.book_id}-${item.format_id}`}
                      className="cart-item"
                    >


                      <div className="item-info">


                        <p>
                          {
                            item.format_type
                          }
                        </p>


                        <h4>
                          {
                            item.title
                          }
                        </h4>


                        <p className="item-price">
                          {formatPrice(item.subtotal)}
                        </p>


                      </div>





                      <div className="container-item-actions">


                        <div className="item-actions">


                          <div className="quantity-control">


                            <button
                              className="qty-btn"
                              onClick={() =>
                                setQuantity(
                                  item,
                                  item.quantity - 1
                                )
                              }
                            >
                              −
                            </button>



                            <span className="quantity">
                              {item.quantity}
                            </span>



                            <button
                              className="qty-btn"
                              onClick={() =>
                                setQuantity(
                                  item,
                                  item.quantity + 1
                                )
                              }
                            >
                              +
                            </button>


                          </div>





                          <button
                            onClick={() => removeItems(item)}
                            className="remove-btn"
                          >
                            Remove
                          </button>


                        </div>


                      </div>


                    </div>


                  ))
                }


              </div>





              <div className="discount-section">


                <div className="discount-summary-row">

                  <span>
                    Subtotal:
                  </span>


                  <span>
                    {formatPrice(subtotal)}
                  </span>


                </div>


              </div>




              <div className="cart-footer">


                <div className="total">

                  <span>
                    Total:
                  </span>


                  <span className="total-amount">
                    {formatPrice(total)}
                  </span>


                </div>




                <button
                  className="checkout-btn"
                  onClick={handleCheckout}
                >
                  Checkout
                </button>


              </div>




            </div>


          )
      }



      <Notification
        ref={notificationRef}
      />


    </div>

  );


}