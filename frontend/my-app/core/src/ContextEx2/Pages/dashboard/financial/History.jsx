import { useEffect, useState } from "react";

import OrderService from "../../../Services/OrderService";
import { formatPrice } from "../../../utils/formatPrice";

import "../../../Styles/components/History.css";


// status => Pending Payment, Processing Order, Shipped , Delivered , Cancelled


export default function History() {


  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  // ============================================
  // Load Orders
  // ============================================

  useEffect(() => {


    const loadOrders = async () => {

      try {


        const response =
          await OrderService.getOrders();



        setOrders(
          response.data.results ||
          response.data
        );


      }
      catch (err) {


        console.error(
          "Failed loading orders:",
          err
        );


        setError(
          "Could not load order history."
        );


      }
      finally {

        setLoading(false);

      }


    };


    loadOrders();


  }, []);




  // ============================================
  // States
  // ============================================

  if (loading) {

    return (
      <p>
        Loading orders...
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



  if (orders.length === 0) {

    return (
      <p>
        No orders yet.
      </p>
    );

  }





  return (

    <>


      {orders.map(order => (

        <div
          key={order.id}
          className="history-cards"
        >

          <div className="history-cards-content">

            <div className="history-cards-main">

              <div>
                <h3>
                  Order #{order.id}
                </h3>

                <p className="history-card-small-text">
                  {new Date(order.created_at)
                    .toLocaleDateString()}
                </p>
              </div>


              <div className="history-cards-total-amount">
                {formatPrice(order.total_amount)}
              </div>

            </div>



            <div className="history-card-right-section">

              <p>
                {order.status_display}
              </p>

            </div>



            <hr />


            <h4>
              Items
            </h4>


            <div className="order-items">

              {
                order.items.map(item => (

                  <div
                    key={item.id}
                    className="order-item"
                  >

                    <p>
                      📘 {item.book_title}
                    </p>

                    <p>
                      By {item.author_name}
                    </p>

                    <p>
                      Quantity: {item.quantity}
                    </p>

                    <p>
                      Price: {formatPrice(item.snapshot_price)}
                    </p>

                  </div>

                ))
              }

            </div>


          </div>

        </div>

      ))}


    </>

  );


}