import { useEffect, useState } from "react";

import WalletService from "../../../Services/WalletService";
import { formatPrice } from "../../../utils/formatPrice";

import "../../../Styles/components/History.css";



export default function Transactions() {


    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");



    // ============================================
    // Load Transactions
    // ============================================

    useEffect(() => {


        const loadTransactions = async () => {

            try {

                const response =
                    await WalletService.getTransactions();


                setTransactions(
                    response.data.results ||
                    response.data
                );


            }
            catch (err) {

                console.error(
                    "Failed loading wallet transactions:",
                    err
                );


                setError(
                    "Could not load wallet history."
                );

            }
            finally {

                setLoading(false);

            }

        };


        loadTransactions();


    }, []);





    // ============================================
    // States
    // ============================================


    if (loading) {

        return (
            <p>
                Loading transactions...
            </p>
        );

    }



    if (error) {

        return (
            <p>
                {error}
            </p>
        );

    }



    if (transactions.length === 0) {

        return (
            <p>
                No wallet transactions yet.
            </p>
        );

    }





    return (

        <>

            {
                transactions.map(transaction => (

                    <div

                        key={transaction.id}

                        className="history-cards"

                    >

                        <div className="history-cards-content">


                            <div className="history-cards-main">


                                <div>

                                    <h3>

                                        {transaction.transaction_type_display}

                                    </h3>


                                    <p className="history-card-small-text">

                                        {
                                            new Date(
                                                transaction.created_at
                                            )
                                                .toLocaleDateString()
                                        }

                                    </p>


                                </div>



                                <div className="history-cards-total-amount">

                                    {
                                        transaction.amount > 0
                                            ? "+"
                                            : ""
                                    }

                                    {formatPrice(transaction.amount)}

                                </div>


                            </div>





                            <div className="history-card-right-section">

                                <p>

                                    Balance:
                                    {" "}

                                    {formatPrice(transaction.balance_after)}

                                </p>


                            </div>




                            <hr />



                            <p>

                                {
                                    transaction.description ||
                                    "No description"
                                }

                            </p>


                        </div>


                    </div>

                ))
            }


        </>

    );

}