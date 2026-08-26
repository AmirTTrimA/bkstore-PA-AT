import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../Styles/components/PaymentResult.css";


// ============================================
//    Main
// ============================================

export default function PaymentResult() {

    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    const status = searchParams.get("status");

    const isSuccess = status === "success";


    // ============================================
    //    Effect
    // ============================================

    useEffect(() => {

        if (isSuccess) {
            console.log(
                "Wallet payment completed successfully."
            );
        }

    }, [isSuccess]);


    // ============================================
    //    Handlers
    // ============================================

    const handleBackToDashboard = () => {
        navigate("/dashboard");
    };


    // ============================================
    //    Render
    // ============================================

    return (

        <div className="payment-result-page">

            <div
                className={`payment-result-card ${isSuccess
                        ? "payment-result-success"
                        : "payment-result-failed"
                    }`}
            >

                {/* Status Icon */}

                <div className="payment-result-icon">

                    {isSuccess ? "✓" : "!"}

                </div>


                {/* Title */}

                <h1 className="payment-result-title">

                    {isSuccess
                        ? "Payment Successful"
                        : "Payment Failed"
                    }

                </h1>


                {/* Message */}

                <p className="payment-result-message">

                    {isSuccess

                        ? "Your wallet has been charged successfully."

                        : "Your payment could not be completed."
                    }

                </p>


                {/* Action */}

                <button
                    type="button"
                    className="payment-result-button"
                    onClick={handleBackToDashboard}
                >

                    Back to Dashboard

                </button>

            </div>

        </div>

    );
}