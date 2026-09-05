import {
    useCallback,
    useEffect,
    useState
} from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";

import BasketService from "../../Services/BasketService";

import Notification from "../../Components/feature/Notification";

import "../../Styles/components/Checkout.css";



// ============================================
// Main
// ============================================

export default function Checkout() {


    const { isLoggedIn } = useAuth();

    const notificationRef = useRef(null);



    // ============================================
    // State
    // ============================================

    const [step, setStep] = useState(1);

    const [cartItems, setCartItems] = useState([]);

    const [shippingInfo, setShippingInfo] = useState({

        name: "",
        address: "",
        city: "",
        country: ""

    });


    const [order, setOrder] = useState(null);


    const [loading, setLoading] = useState(false);


    const [error, setError] = useState("");

    const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("");

    const handlePaymentMethodSelect = useCallback((method) => {
        setSelectedPaymentMethod(method);
    }, [])





    // ============================================
    // Load Basket
    // ============================================

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
                    "Could not load basket."
                );

            }

        };


        loadBasket();


    }, []);





    // ============================================
    // Helpers
    // ============================================


    const subtotal =
        cartItems.reduce(
            (sum, item) =>
                sum +
                Number(item.subtotal),
            0
        );



    const hasItems =
        cartItems.length > 0;





    // ============================================
    // Shipping
    // ============================================


    const handleChange = (event) => {


        const {
            name,
            value
        } = event.target;


        setShippingInfo(prev => ({

            ...prev,

            [name]: value

        }));


    };





    const validateShipping = () => {


        if (
            !shippingInfo.name ||
            !shippingInfo.address ||
            !shippingInfo.city ||
            !shippingInfo.country
        ) {


            notificationRef.current.showNotif(
                "Please complete shipping information.",
                "error"
            );


            return false;

        }


        return true;

    };





    const continueToSummary = () => {


        if (
            validateShipping()
        ) {

            setStep(2);

        }


    };






    // ============================================
    // Submit Order
    // ============================================


    const handlePlaceOrder = async () => {


        try {


            setLoading(true);



            const response =
                await BasketService.checkout({

                    shipping_name:
                        shippingInfo.name,


                    shipping_address_line1:
                        shippingInfo.address,


                    shipping_city:
                        shippingInfo.city,


                    shipping_country:
                        shippingInfo.country,


                    discount_code: ""

                });



            setOrder(
                response.data
            );


            setStep(3);



        } catch (err) {


            console.error(
                "Checkout failed:",
                err.response?.data
            );


            notificationRef.current.showNotif(
                "Failed to create order.",
                "error"
            );


        } finally {


            setLoading(false);


        }


    };






    // ============================================
    // Guards
    // ============================================


    if (!isLoggedIn) {

        return (
            <Navigate to="/login" />
        );

    }



    if (!hasItems && !order) {

        return (
            <div className="checkout-form">

                <h2>
                    Your basket is empty.
                </h2>

            </div>
        );

    }

    const handleContinueToPayment = useCallback(() => {
        // double check (dont happen commonly)
        if (!selectedPaymentMethod) {
            notificationRef.current.showNotif('please select payment method', 'error');
            return
        }
        // not enough  cash in wallet 
        // ✅notif work
        // if(wallet < total.toFixed(2)){
        //     notificationRef.current.showNotif('Not enogh credit in wallet','error');
        //     return
        // }
        // navigate to shaparak if select card
    }, [selectedPaymentMethod])


    if (error) {

        return (

            <div className="checkout-form">

                {error}

            </div>

        );

    }







    // ============================================
    // Render
    // ============================================


    return (


        <div className="checkout-form">


            <Notification
                ref={notificationRef}
            />



            {/* =========================
                STEP 1
            ========================== */}


            {
                step === 1 && (

                    <div className="step1">


                        <h2 className="title-checkout">

                            Checkout

                        </h2>


                        <p>
                            Provide your shipping address
                        </p>




                        <input

                            className="checkout-field"

                            name="name"

                            placeholder="Receiver name"

                            value={
                                shippingInfo.name
                            }

                            onChange={
                                handleChange
                            }

                        />





                        <input

                            className="checkout-field"

                            name="address"

                            placeholder="Address"

                            value={
                                shippingInfo.address
                            }

                            onChange={
                                handleChange
                            }

                        />





                        <input

                            className="checkout-field"

                            name="city"

                            placeholder="City"

                            value={
                                shippingInfo.city
                            }

                            onChange={
                                handleChange
                            }

                        />





                        <input

                            className="checkout-field"

                            name="country"

                            placeholder="Country"

                            value={
                                shippingInfo.country
                            }

                            onChange={
                                handleChange
                            }

                        />





                        <button

                            className="checkout-continue-btn"

                            onClick={
                                continueToSummary
                            }

                        >

                            Continue

                        </button>



                    </div>

                )

            }







            {/* =========================
                STEP 2
            ========================== */}


            {
                step === 2 && (


                    <div className="step2">


                        <h2 className="title-checkout">

                            Order Summary

                        </h2>



                        <div className="checkout-items">


                            {
                                cartItems.map(item => (


                                    <div

                                        key={
                                            `${item.book_id}-${item.format_id}`
                                        }

                                        className="checkout-item"

                                    >

                                        <span>

                                            {item.title}

                                            {" x "}

                                            {item.quantity}

                                        </span>


                                        <span>

                                            $
                                            {
                                                Number(
                                                    item.subtotal
                                                ).toFixed(2)

                                            }

                                        </span>


                                    </div>


                                ))

                            }


                        </div>





                        <div className="checkout-summary">


                            <p>

                                Current subtotal:

                                {" $"}

                                {
                                    subtotal.toFixed(2)
                                }

                            </p>



                            <p>

                                Final amount will be calculated by server.

                            </p>


                        </div>






                        <button

                            className="checkout-btn"

                            disabled={loading}

                            onClick={
                                handlePlaceOrder
                            }

                        >

                            {
                                loading
                                    ? "Submitting..."
                                    : "Place Order"
                            }


                        </button>



                    </div>


                )

            }








            {/* =========================
                STEP 3
            ========================== */}



            {
                step === 3 && order && (


                    <div className="step3">


                        <h2>

                            Order completed!

                        </h2>



                        <p>

                            Your order number:

                            {" #"}

                            {
                                order.id
                            }

                        </p>



                        <p>

                            Status:

                            {" "}

                            {
                                order.status_display ||
                                order.status
                            }

                        </p>



                    </div>


                )

            }





        </div>


    );


}