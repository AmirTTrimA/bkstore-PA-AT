// ✅
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Styles/components/Refund.css';



// ============================================
//      Main 
// ============================================

export default function Refund() {
  const navigate = useNavigate();

  return (
    <>
      
      <div className="refund-container">
        {/* Header */}
        <div className="refund-header">
          <button className="refund-back-btn" onClick={() => navigate('/home')}>
            Back to Home
          </button>
          <h1>Refund Policy</h1>
          <p>Last updated: June 2026</p>
        </div>

        <div className="refund-content">
          {/* Section1 */}
          <section className="refund-section">
            <h2>1. Our Commitment</h2>
            <p>
              At PageNet, we strive to provide the best digital reading experience. 
              If you're not completely satisfied with your purchase, we're here to help.
            </p>
          </section>
          {/* Section2 */}
          <section className="refund-section">
            <h2>2. Digital Products</h2>
            <p>
              For digital products (e-books, PDFs, and digital subscriptions), 
              we offer a <strong>7-day money-back guarantee</strong> from the date of purchase.
            </p>
            <ul>
              <li>✅ Full refund if the product is not as described</li>
              <li>✅ Partial refund for technical issues</li>
              <li>❌ No refund for change of mind after download</li>
            </ul>
          </section>

          {/* Section3 */}
          <section className="refund-section">
            <h2>3. Subscription Plans</h2>
            <div className="refund-grid">
              <div className="refund-card">
                <h3>Monthly Plan</h3>
                <p>Cancel anytime before renewal</p>
                <span className="refund-badge">Pro-rated refund</span>
              </div>
              <div className="refund-card">
                <h3>Annual Plan</h3>
                <p>Full refund within first 30 days</p>
                <span className="refund-badge">Partial refund after</span>
              </div>
            </div>
          </section>

          {/* Section4 */}
          <section className="refund-section">
            <h2>4. How to Request a Refund</h2>
            <ol className="refund-steps">
              <li>
                <span className="refund-step-number">1</span>
                <div>
                  <h4>Contact Support</h4>
                  <p>Email us at <a href="mailto:support@pagenet.com">support@pagenet.com</a></p>
                </div>
              </li>
              <li>
                <span className="refund-step-number">2</span>
                <div>
                  <h4>Provide Details</h4>
                  <p>Include your order number and reason for refund</p>
                </div>
              </li>
              <li>
                <span className="refund-step-number">3</span>
                <div>
                  <h4>Processing Time</h4>
                  <p>We'll respond within 24-48 hours</p>
                </div>
              </li>
            </ol>
          </section>

          {/* Section5 */}
          <section className="refund-section">
            <h2>5. Refund Processing</h2>
            <ul>
              <li> Refunds are processed within 5-10 business days</li>
              <li> Credits will be applied to your original payment method</li>
              <li> Contact your bank if the refund isn't showing</li>
            </ul>
          </section>

          {/* Section6 */}
          <section className="refund-section">
            <h2>6. Exceptions</h2>
            <div className="refund-exception-box">
              <p><strong>No refunds for:</strong></p>
              <ul>
                <li>Purchases older than 30 days</li>
                <li>Products already downloaded completely</li>
                <li>User-generated content</li>
              </ul>
            </div>
          </section>

          {/* Section7 */}
          <section className="refund-section contact-section">
            <h2>7. Need Help?</h2>
            <div className="refund-contact-options">
              <button 
                className="refund-contact-btn privacy"
                onClick={()=> navigate('/privacy-policy')}
              >
                Privacy policy
              </button>
              <button 
                className="refund-contact-btn about" 
                onClick={()=> navigate('/about-us')}
              >
                About-us
              </button>
              <button 
                className="refund-contact-btn faq" 
                onClick={()=> navigate('/faq')}
              >
                 FAQ
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="refund-footer-note">
          <p>
            <strong>Note:</strong> This refund policy applies to all purchases made 
            through PageNet platform. We reserve the right to update this policy at any time.
          </p>
        </div>
      </div>
      
    </>
  );
}