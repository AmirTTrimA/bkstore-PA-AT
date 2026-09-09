import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import '../../Styles/components/PrivacyPolicy.css';


// ============================================
//      Main 
// ============================================
const PrivacyPolicy = () => {
    const { isPersian } = useLanguage();

    if (isPersian) {
        return (
            <div className="privacy-policy-container" style={{ direction: 'rtl' }}>
                <div className="privacy-policy-content">
                    {/* Header */}
                    <div className="policy-header">
                        <Link to="/home" className="policy-back-home">بازگشت به خانه</Link>
                        <h1>سیاست حفظ حریم خصوصی</h1>
                        <p className="policy-last-updated">آخرین به‌روزرسانی: خرداد ۱۴۰۵</p>
                    </div>

                    {/* Section1 */}
                    <div className="policy-section">
                        <h2>۱. اطلاعاتی که جمع‌آوری می‌کنیم</h2>
                        <p>ما اطلاعاتی را که مستقیماً در اختیار ما قرار می‌دهید دریافت و ذخیره می‌کنیم، از جمله:</p>
                        <ul>
                            <li><strong>اطلاعات حساب کاربری:</strong> نام، آدرس ایمیل، نام کاربری و رمز عبور رمزنگاری‌شده</li>
                            <li><strong>اطلاعات پروفایل:</strong> تصویر نمایه، بیوگرافی و اولویت‌های موضوعی</li>
                            <li><strong>اطلاعات خرید:</strong> کتاب‌های خریداری‌شده، رسیدهای پرداخت و وضعیت سفارش‌ها</li>
                            <li><strong>ارتباطات:</strong> پیام‌های پشتیبانی، دیدگاه‌ها و امتیازات شما به کتاب‌ها</li>
                            <li><strong>داده‌های کاربری:</strong> پیشرفت مطالعه کتاب الکترونیکی، نشانه‌گذاری‌ها و یادداشت‌ها</li>
                        </ul>
                    </div>

                    {/* Section2 */}
                    <div className="policy-section">
                        <h2>۲. نحوه استفاده از اطلاعات</h2>
                        <p>اطلاعات شما در جهت اهداف زیر به کار گرفته می‌شود:</p>
                        <ul>
                            <li>پردازش تراکنش‌های خرید، صدور فاکتور و ارسال کتب فیزیکی</li>
                            <li>شخصی‌سازی تجربه مطالعه و ذخیره‌سازی آخرین صفحه در کتاب‌خوان آنلاین</li>
                            <li>پیشنهاد کتاب‌های جدید متناسب با سلیقه و سبک مطالعه شما</li>
                            <li>اطلاع‌رسانی درباره وضعیت سفارش‌ها و هشدارهای امنیتی حساب</li>
                            <li>ارتقای مداوم پلتفرم، زیرساخت و رفع خطاهای فنی</li>
                            <li>محافظت در برابر هرگونه کلاهبرداری یا دسترسی‌های غیرمجاز</li>
                        </ul>
                    </div>

                    {/* Section3 */}
                    <div className="policy-section">
                        <h2>۳. اشتراک‌گذاری اطلاعات با اشخاص ثالث</h2>
                        <p>پیج‌نت هرگز اطلاعات هویتی و شماره تماس شما را به هیچ نهاد تبلیغاتی نمی‌فروشد. اشتراک‌گذاری داده‌ها تنها محدود به موارد زیر است:</p>
                        <ul>
                            <li><strong>ارائه‌دهندگان خدمات پرداخت:</strong> بانک‌ها و درگاه‌های شاپرک جهت انجام تراکنش</li>
                            <li><strong>خدمات پستی:</strong> درج نشانی جهت تحویل کتاب‌های چاپی</li>
                            <li><strong>الزامات قانونی:</strong> در صورت درخواست مراجع قضایی رسمی</li>
                        </ul>
                    </div>

                    {/* Section4 */}
                    <div className="policy-section">
                        <h2>۴. امنیت و رمزنگاری داده‌ها</h2>
                        <p>ما از بالاترین استانداردهای امنیتی صنعت بهره می‌بریم، از جمله:</p>
                        <ul>
                            <li>رمزنگاری سراسری SSL/TLS برای تمامی تبادلات داده</li>
                            <li>پردازش امن اطلاعات مالی بدون ذخیره‌سازی اطلاعات کارت بانکی</li>
                            <li>آزمون‌های امنیتی و ممیزی‌های دوره‌ای روی سرورها</li>
                            <li>سیستم احراز هویت دوعاملی و کنترل دقیق سطوح دسترسی</li>
                        </ul>
                    </div>

                    {/* Section5 */}
                    <div className="policy-section">
                        <h2>۵. حقوق و اختیارات کاربران</h2>
                        <p>شما در هر زمان از اختیارات زیر برخوردارید:</p>
                        <ul>
                            <li>مشاهده و ویرایش اطلاعات پروفایل و نشانی‌ها</li>
                            <li>حذف حساب کاربری و اطلاعات مرتبط با آن</li>
                            <li>لغو اشتراک خبرنامه‌ها و پیامک‌های اطلاع‌رسانی</li>
                            <li>دریافت نسخه پشتیبان از کتاب‌ها و یادداشت‌های ثبت‌شده</li>
                        </ul>
                    </div>

                    {/* Section6 */}
                    <div className="policy-section">
                        <h2>۶. کوکی‌ها و فایل‌های ردگیری</h2>
                        <p>پیج‌نت از کوکی‌های فنی جهت بهبود سرعت، ماندگاری نشست کاربری و نگهداری سبد خرید استفاده می‌کند.</p>
                    </div>

                    {/* Section7 */}
                    <div className="policy-section">
                        <h2>۷. ارتباط با پشتیبانی امنیت و داده</h2>
                        <p>در صورت داشتن هرگونه سوال یا درخواست پیرامون حریم خصوصی، می‌توانید با ما تماس بگیرید:</p>
                        <ul className="policy-contact-info">
                            <li><strong>ایمیل پشتیبانی:</strong> support@pagenet.com</li>
                            <li><strong>تلفن پاسخگویی:</strong> ۰۲۱-۷۷۴۵۰۰۰۰</li>
                            <li><strong>نشانی:</strong> تهران، دانشگاه علم و صنعت ایران، مرکز نوآوری پیج‌نت</li>
                        </ul>
                    </div>

                    {/* Footer */}
                    <div className="policy-footer">
                        <p>استفاده از سامانه کتابخوانی پیج‌نت به معنای پذیرش کامل این منشور اخلاقی و حریم خصوصی است.</p>
                    </div>
                </div>
            </div>
        );
    }
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