import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import SimpleNav from "../../Components/SimpleNav";
import Notification from "../../Components/feature/Notification";

import SubscriptionService from "../../Services/SubscriptionService";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Subscription.css";


// ============================================
//      Main
// ============================================

export default function Subscription() {

    const navigate = useNavigate();

    const notificationRef = useRef(null);


    // -------------------------
    // State
    // -------------------------

    const [plans, setPlans] = useState([]);

    const [subscriptions, setSubscriptions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [autoRenew, setAutoRenew] = useState(false);

    const [purchasingPlanId, setPurchasingPlanId] = useState(null);



    // -------------------------
    // Derived state
    // -------------------------

    const activeSubscription =
        subscriptions.find(
            sub => sub.status === "ACTIVE"
        );


    const reservedSubscription =
        subscriptions.find(
            sub => sub.status === "RESERVED"
        );


    const hasActiveSubscription =
        Boolean(activeSubscription);



    // -------------------------
    // Load data
    // -------------------------

    const loadData = async () => {

        try {

            const plansResponse =
                await SubscriptionService.getPlans();


            setPlans(
                plansResponse.data.results ||
                plansResponse.data
            );


            const subscriptionResponse =
                await SubscriptionService.getMySubscriptions();


            setSubscriptions(
                subscriptionResponse.data.results || []
            );


        }
        catch (err) {

            console.error(err);

            setError(
                "Failed to load subscriptions."
            );

        }
        finally {

            setLoading(false);

        }

    };



    useEffect(() => {

        loadData();

    }, []);



    // -------------------------
    // Purchase / Upgrade
    // -------------------------

    const handlePlanAction = async (plan) => {


        try {

            setPurchasingPlanId(plan.id);



            const payload = {

                plan_id: Number(plan.id),

                auto_renew: autoRenew,

            };



            if (hasActiveSubscription) {

                await SubscriptionService.upgrade(
                    payload
                );

            }
            else {

                await SubscriptionService.purchase(
                    payload
                );

            }



            await loadData();



            notificationRef.current?.showNotif(

                "Subscription updated successfully",

                "success"

            );


        }
        catch (err) {

            console.error(err);


            notificationRef.current?.showNotif(

                err.response?.data?.detail ||

                "Subscription failed",

                "error"

            );

        }
        finally {

            setPurchasingPlanId(null);

        }

    };





    return (

        <>

            <div className="sub-nav">

                <SimpleNav />

            </div>



            <Notification
                ref={notificationRef}
            />



            <div className="sub-container">



                <button

                    className="big-back-btn"

                    onClick={() => navigate(-1)}

                >

                    <i className="fas fa-angle-left"></i>

                </button>





                <div className="title-container">

                    <h2 className="sub-title">

                        Subscription

                    </h2>

                </div>





                {loading && (

                    <div className="subscription-state">

                        <p>
                            Loading subscription plans...
                        </p>

                    </div>

                )}






                {!loading && error && (

                    <div className="subscription-state">

                        <p>
                            {error}
                        </p>

                    </div>

                )}






                {!loading && !error && (


                    <>



                        {activeSubscription && (

                            <div className="current-subscription active">


                                <h3>
                                    Current Subscription
                                </h3>



                                <p>

                                    Plan:
                                    {" "}

                                    {activeSubscription.plan.name}

                                </p>



                                <p>

                                    Active until:
                                    {" "}

                                    {
                                        new Date(
                                            activeSubscription.end_date
                                        )
                                            .toLocaleDateString()
                                    }

                                </p>



                                <p>

                                    Auto renew:
                                    {" "}

                                    {
                                        activeSubscription.auto_renew

                                            ?

                                            "Enabled"

                                            :

                                            "Disabled"

                                    }

                                </p>


                            </div>

                        )}






                        {reservedSubscription && (

                            <div className="reserved-subscription reserved">


                                <h3>
                                    Scheduled Subscription
                                </h3>



                                <p>

                                    Plan:
                                    {" "}

                                    {reservedSubscription.plan.name}

                                </p>



                                <p>

                                    Starts:
                                    {" "}

                                    {
                                        new Date(
                                            reservedSubscription.start_date
                                        )
                                            .toLocaleDateString()
                                    }

                                </p>



                            </div>

                        )}



                        <div className="auto-renew-container">


                            <label className="auto-renew-label">


                                <input

                                    type="checkbox"

                                    checked={autoRenew}

                                    onChange={
                                        e =>
                                            setAutoRenew(
                                                e.target.checked
                                            )
                                    }

                                />



                                <span>

                                    Automatically renew my subscription

                                </span>


                            </label>



                            <p className="auto-renew-help">

                                Your subscription will renew automatically when it expires.

                            </p>

                            <p className="auto-renew-help">
                                {autoRenew
                                    ? "Your next subscription will renew automatically."
                                    : "Your subscription will expire unless renewed manually."
                                }
                            </p>


                        </div>


                        <div className="cards-container">


                            {plans.map((plan, index) => (


                                <div

                                    key={plan.id}

                                    className="card"

                                    id={`op-${index + 1}`}

                                >



                                    <div className="card-top">


                                        <h4 className="sub-title2">

                                            {plan.name}

                                        </h4>



                                        <p className="description">

                                            {
                                                plan.digital_discount_percent > 0

                                                    ?

                                                    `${plan.digital_discount_percent}% discount on digital books`

                                                    :

                                                    "No digital book discount"
                                            }

                                        </p>


                                    </div>





                                    <p className="sub-price">

                                        {formatPrice(plan.monthly_price)}

                                        <span className="price-period">

                                            {" "} / month

                                        </span>


                                    </p>





                                    <button

                                        className="sub-buy-btn"

                                        disabled={

                                            purchasingPlanId === plan.id ||

                                            activeSubscription?.plan.id === plan.id

                                        }


                                        onClick={() =>
                                            handlePlanAction(plan)
                                        }


                                    >


                                        {

                                            purchasingPlanId === plan.id

                                                ?

                                                "Processing..."

                                                :

                                                activeSubscription?.plan.id === plan.id

                                                    ?

                                                    "Current Plan"

                                                    :

                                                    hasActiveSubscription

                                                        ?

                                                        "Upgrade"

                                                        :

                                                        "Buy"

                                        }


                                    </button>


                                </div>


                            ))}


                        </div>



                    </>

                )}


            </div>


        </>

    );

}