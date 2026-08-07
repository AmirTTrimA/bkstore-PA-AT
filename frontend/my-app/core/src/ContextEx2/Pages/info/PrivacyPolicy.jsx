// ✅
import React from 'react';
import { Link } from 'react-router-dom';
import '../../Styles/components/PrivacyPolicy.css';


// ============================================
//      Main 
// ============================================
const PrivacyPolicy = () => {
    return (
        <div className="privacy-policy-container">
            <div className="privacy-policy-content">
                {/* Header */}
                <div className="policy-header">
                    <Link to="/home" className="policy-back-home">Back to Home</Link>
                    <h1>Privacy Policy</h1>
                    <p className="policy-last-updated">Last Updated: January 1, 2024</p>
                </div>

                {/* Section1 */}
                <div className="policy-section">
                    <h2>1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, including:</p>
                    <ul>
                        <li><strong>Account Information:</strong> Name, email address, password</li>
                        <li><strong>Profile Information:</strong> Profile picture, bio, preferences</li>
                        <li><strong>Purchase Information:</strong> Books purchased, payment details</li>
                        <li><strong>Communication:</strong> Messages, reviews, feedback</li>
                        <li><strong>Usage Data:</strong> Reading progress, bookmarks, highlights</li>
                    </ul>
                </div>

                {/* Section2 */}
                <div className="policy-section">
                    <h2>2. How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul>
                        <li>Process your book purchases and deliveries</li>
                        <li>Personalize your reading experience</li>
                        <li>Recommend books based on your interests</li>
                        <li>Communicate about your account and orders</li>
                        <li>Improve our services and website functionality</li>
                        <li>Protect against fraud and unauthorized transactions</li>
                    </ul>
                </div>

                {/* Section3 */}
                <div className="policy-section">
                    <h2>3. Information Sharing</h2>
                    <p>We do not sell your personal information. We may share information:</p>
                    <ul>
                        <li><strong>Service Providers:</strong> Payment processing, delivery services</li>
                        <li><strong>Legal Requirements:</strong> When required by law</li>
                        <li><strong>Business Transfers:</strong> In case of merger or acquisition</li>
                        <li><strong>With Your Consent:</strong> When you explicitly agree</li>
                    </ul>
                </div>

                {/* Section4 */}
                <div className="policy-section">
                    <h2>4. Data Security</h2>
                    <p>We implement industry-standard security measures including:</p>
                    <ul>
                        <li>SSL/TLS encryption for data transmission</li>
                        <li>Secure payment processing</li>
                        <li>Regular security audits</li>
                        <li>Access controls and authentication</li>
                    </ul>
                </div>

                {/* Section5 */}
                <div className="policy-section">
                    <h2>5. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate information</li>
                        <li>Delete your account and data</li>
                        <li>Opt-out of marketing communications</li>
                        <li>Download your data</li>
                    </ul>
                    <p className="policy-contact-note">Contact us to exercise these rights.</p>
                </div>

                {/* Section6 */}
                <div className="policy-section">
                    <h2>6. Cookies and Tracking</h2>
                    <p>We use cookies to:</p>
                    <ul>
                        <li>Remember your login status</li>
                        <li>Save your reading preferences</li>
                        <li>Analyze site traffic and usage</li>
                        <li>Personalize book recommendations</li>
                    </ul>
                    <p>You can control cookies through your browser settings.</p>
                </div>

                {/* Section7 */}
                <div className="policy-section">
                    <h2>7. Children's Privacy</h2>
                    <p>Our services are not directed to children under 13. We do not knowingly collect information from children under 13. If you believe a child has provided us with personal information, please contact us.</p>
                </div>

                {/* Section8 */}
                <div className="policy-section">
                    <h2>8. Third-Party Links</h2>
                    <p>Our website may contain links to third-party websites (publishers, authors, payment providers). We are not responsible for their privacy practices. Please review their privacy policies.</p>
                </div>
                {/* Section9 */}
                <div className="policy-section">
                    <h2>9. Changes to This Policy</h2>
                    <p>We may update this privacy policy periodically. We will notify you of significant changes via email or website notice. Continued use of our services constitutes acceptance of updated terms.</p>
                </div>
                {/* Section10 */}
                <div className="policy-section">
                    <h2>10. Contact Us</h2>
                    <p>For privacy-related questions or concerns:</p>
                    <ul className="policy-contact-info">
                        <li><strong>Email:</strong> heidar@bookstore.com</li>
                        <li><strong>Phone:</strong> +1 (555) 123-4567</li>
                        <li><strong>Address:</strong> 123 Book Lane, Reading City, RC 12345</li>
                    </ul>
                </div>
                {/* Footer */}
                <div className="policy-footer">
                    <p>By using our bookstore, you agree to this Privacy Policy.</p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;