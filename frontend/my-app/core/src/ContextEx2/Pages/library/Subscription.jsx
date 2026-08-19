import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import SimpleNav from "../../Components/SimpleNav";
import ApiClient from "../../Services/ApiClient";

import "../../Styles/components/Subscription.css";


// ============================================
//      Main
// ============================================

export default function Subscription() {

    const navigate = useNavigate();


    // --- State ---

    const [plans, setPlans] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");



    // ============================================
    //      Load Subscription Plans
    // ============================================

    useEffect(() => {

        const loadPlans = async () => {

            try {

                const response =
                    await ApiClient.get("/pricing/plans/");

                setPlans(response.data.results);

            }
            catch (err) {

                console.error(
                    "Failed to load subscription plans:",
                    err
                );

                setError(
                    err.response?.data?.detail ||
                    "Failed to load subscription plans."
                );

            }
            finally {

                setLoading(false);

            }

        };

        loadPlans();

    }, []);



    // ============================================
    //      Render
    // ============================================

    return (

        <>

            <div className="sub-nav">
                <SimpleNav />
            </div>


            <div className="sub-container">


                {/* Back Button */}

                <button
                    className="big-back-btn"
                    onClick={() => navigate(-1)}
                >
                    <i className="fas fa-angle-left"></i>
                </button>



                {/* Title */}

                <div className="title-container">

                    <h2 className="sub-title">
                        Subscription
                    </h2>

                </div>



                {/* Loading */}

                {loading && (

                    <div className="subscription-state">

                        <p>
                            Loading subscription plans...
                        </p>

                    </div>

                )}



                {/* Error */}

                {!loading && error && (

                    <div className="subscription-state">

                        <p>
                            {error}
                        </p>

                    </div>

                )}



                {/* Empty */}

                {!loading &&
                    !error &&
                    plans.length === 0 && (

                        <div className="subscription-state">

                            <p>
                                No subscription plans are currently available.
                            </p>

                        </div>

                    )}



                {/* Cards */}

                {!loading &&
                    !error &&
                    plans.length > 0 && (

                        <div className="cards-container">

                            {plans.map((plan, index) => (

                                <div
                                    key={plan.slug}
                                    className="card"
                                    id={`op-${index + 1}`}
                                >

                                    <div className="card-top">

                                        <h4 className="sub-title2">
                                            {plan.name}
                                        </h4>


                                        <p className="description">

                                            {plan.digital_discount_percent > 0
                                                ? `${plan.digital_discount_percent}% discount on digital books`
                                                : "No digital book discount"
                                            }

                                        </p>

                                    </div>



                                    <p className="sub-price">

                                        ${Number(
                                            plan.monthly_price
                                        ).toFixed(2)}

                                        <span className="price-period">
                                            {" "} / month
                                        </span>

                                    </p>



                                    <button
                                        className="sub-buy-btn"
                                        type="button"
                                        disabled
                                        title="Subscription purchase is not available yet"
                                    >
                                        Buy
                                    </button>

                                </div>

                            ))}

                        </div>

                    )}

            </div>

        </>

    );

}