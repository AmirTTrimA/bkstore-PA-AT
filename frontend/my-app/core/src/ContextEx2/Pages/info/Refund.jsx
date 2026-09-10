import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import '../../Styles/components/Refund.css';



// ============================================
//      Main 
// ============================================

export default function Refund() {
  const navigate = useNavigate();
  const { isPersian } = useLanguage();

  if (isPersian) {
    return (
      <div className="refund-container" style={{ direction: 'rtl' }}>
        {/* Header */}
        <div className="refund-header">
          <button className="refund-back-btn" onClick={() => navigate('/home')}>
            بازگشت به خانه
          </button>
          <h1>قوانین استرداد و بازگشت وجه</h1>
          <p>آخرین به‌روزرسانی: خرداد ۱۴۰۵</p>
        </div>

        <div className="refund-content">
          {/* Section1 */}
          <section className="refund-section">
            <h2>۱. تعهد ما به کاربران</h2>
            <p>
              در بوک‌کده هدف ما ارائه لذت‌بخش‌ترین تجربه مطالعه دیجیتال و تهیه کتاب است. 
              در صورت بروز هرگونه مشکل یا عدم رضایت، تیم پشتیبانی ما آماده رفع دغدغه شماست.
            </p>
          </section>

          {/* Section2 */}
          <section className="refund-section">
            <h2>۲. کتب دیجیتال و صوتی</h2>
            <p>
              برای محصولات دیجیتال (کتاب‌های الکترونیکی، فایل‌های صوتی و اشتراک)، 
              <strong>ضمانت بازگشت وجه تا ۷ روز</strong> بر اساس شرایط زیر لحاظ می‌شود:
            </p>
            <ul>
              <li>✅ بازپرداخت کامل در صورت عدم تطابق مشخصات یا خرابی فایل</li>
              <li>✅ بازپرداخت نسبی یا اصلاح فایل در صورت بروز نقص فنی</li>
              <li>❌ عدم امکان بازگشت وجه پس از دانلود و مطالعه کامل فایل سالم</li>
            </ul>
          </section>

          {/* Section3 */}
          <section className="refund-section">
            <h2>۳. طرح‌های اشتراک کتابخوانی</h2>
            <div className="refund-grid">
              <div className="refund-card">
                <h3>اشتراک ماهانه</h3>
                <p>امکان لغو در هر زمان قبل از تاریخ تمدید خودکار</p>
                <span className="refund-badge">محاسبه به نسبت روزهای باقیمانده</span>
              </div>
              <div className="refund-card">
                <h3>اشتراک سالانه</h3>
                <p>امکان استرداد کامل تا ۳۰ روز اول اشتراک</p>
                <span className="refund-badge">استرداد کامل در ماه اول</span>
              </div>
            </div>
          </section>

          {/* Steps */}
          <section className="refund-section">
            <h2>۴. مراحل ثبت درخواست استرداد</h2>
            <ol className="refund-steps">
              <li>
                <span className="refund-step-number">۱</span>
                <div>
                  <h4>ارتباط با پشتیبانی</h4>
                  <p>ارسال ایمیل به <a href="mailto:support@bookkadeh.com">support@bookkadeh.com</a> یا ثبت تیکت در داشبورد</p>
                </div>
              </li>
              <li>
                <span className="refund-step-number">۲</span>
                <div>
                  <h4>ارائه مشخصات خرید</h4>
                  <p>ذکر شماره فاکتور، کد پیگیری سفارش و توضیح علت درخواست</p>
                </div>
              </li>
              <li>
                <span className="refund-step-number">۳</span>
                <div>
                  <h4>بررسی و تسویه</h4>
                  <p>پاسخگویی کارشناسان ظرف ۲۴ الی ۴۸ ساعت کاری</p>
                </div>
              </li>
            </ol>
          </section>

          {/* Section5 */}
          <section className="refund-section">
            <h2>۵. زمان و نحوه عودت مبالغ</h2>
            <ul>
              <li>مبالغ تأییدشده ظرف ۲۴ تا ۷۲ ساعت کاری به کیف پول کاربری یا شماره شبا واریز می‌گردد.</li>
              <li>در صورت شارژ کیف پول، اعتبار بلافاصله جهت سفارش‌های بعدی قابل استفاده است.</li>
            </ul>
          </section>

          {/* Section6 */}
          <section className="refund-section">
            <h2>۶. استثنائات استرداد</h2>
            <div className="refund-exception-box">
              <p><strong>موارد عدم شمول بازپرداخت:</strong></p>
              <ul>
                <li>سفارش‌هایی که بیش از ۳۰ روز از ثبت آن‌ها گذشته باشد</li>
                <li>کتاب‌های چاپی که دچار آسیب فیزیکی توسط خریدار شده باشند</li>
              </ul>
            </div>
          </section>

          {/* Section7 */}
          <section className="refund-section contact-section">
            <h2>۷. نیاز به راهنمایی بیشتر دارید؟</h2>
            <div className="refund-contact-options">
              <button 
                className="refund-contact-btn privacy"
                onClick={()=> navigate('/privacy-policy')}
              >
                حفظ حریم خصوصی
              </button>
              <button 
                className="refund-contact-btn about" 
                onClick={()=> navigate('/about-us')}
              >
                درباره ما
              </button>
              <button 
                className="refund-contact-btn faq" 
                onClick={()=> navigate('/faq')}
              >
                 پرسش‌های متداول
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="refund-footer-note">
          <p>
            <strong>نکته:</strong> این آیین‌نامه بر تمامی سفارش‌های ثبت‌شده در سامانه بوک‌کده حاکم است.
          </p>
        </div>
      </div>
    );
  }

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
              At Bookkadeh, we strive to provide the best digital reading experience. 
              If you're not completely satisfied with your purchase, we're here to help.
            </p>
          </section>
          {/* Section2 */}
          <section className="refund-section">
            <h2>2. Digital Products</h2>
            <p>
              For digital products (e-books, PDFs, and digital subscriptions), 
              we offer a <strong>7-day money-back guarantee</strong> under the following conditions:
            </p>
            <ul>
              <li> Full refund if the file is corrupted and cannot be repaired</li>
              <li> Partial refund or replacement if content doesn't match description</li>
              <li> No refund once the entire file has been downloaded and read</li>
            </ul>
          </section>

          {/* Section3 */}
          <section className="refund-section">
            <h2>3. Subscription Plans</h2>
            <div className="refund-grid">
              <div className="refund-card">
                <h3>Monthly Plan</h3>
                <p>Cancel anytime before the next billing cycle</p>
                <span className="refund-badge">Prorated refund</span>
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
                  <p>Email us at <a href="mailto:support@bookkadeh.com">support@bookkadeh.com</a></p>
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
            through Bookkadeh platform. We reserve the right to update this policy at any time.
          </p>
        </div>
      </div>
      
    </>
  );
}