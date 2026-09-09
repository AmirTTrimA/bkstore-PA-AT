import React, { useState,useRef,useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import '../../Styles/components/Faq.css';



// ============================================
//      Constants
// ============================================
const CATEGORIES = [
  { id: 'All', en: 'All', fa: 'همه' },
  { id: 'Purchasing', en: 'Purchasing', fa: 'خرید و پرداخت' },
  { id: 'Account', en: 'Account', fa: 'حساب کاربری' },
  { id: 'Reading', en: 'Reading', fa: 'مطالعه و کتاب‌ها' },
  { id: 'Shipping', en: 'Shipping', fa: 'ارسال و تحویل' },
];

const FAQ_DATA = [
    {
        question: "How do I purchase a book?",
        answer: "Simply browse our collection, click on the book you want, and press 'Add to Cart'. Then go to your cart and proceed to checkout to complete your purchase.",
        category:'Purchasing'
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept credit/debit cards (Visa, MasterCard, American Express) and PayPal.",
        category:'Purchasing'
    },
    {
        question: "How do I access my e-books?",
        answer: "After purchase, e-books are available in your 'Dashboard' section. You can read them online.",
        category:'Reading'
    },
    {
        question: "Can I return a book?",
        answer: "Physical books can be returned within 1 week of purchase. E-books are non-refundable unless there's a technical issue.",
        category:'Purchasing'
    },
    {
        question: "How do I create an account?",
        answer: "Go to 'Sign Up' , fill in your details, and verify your email address to create an account.",
        category:'Account'
    },
    {
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page, enter your email, and we'll send you a link to reset your password.",
        category:'Account'
    },
    {
        question: "Do you offer discounts for students?",
        answer: "Yes! Students get 20% off on all e-books. Verify your student email to activate the discount.",
        category:'Account'
    },
   
    {
        question: "How do I leave a book comments?",
        answer: "Go to the book's page, scroll to the comments section, and click 'Write a Comment'. You need to be logged in first",
        category:'Reading'
    },
    {
        question: "How do I continue reading from the last place i left?",
        answer: "In dashboard section for e-books we have filed last-page",
        category:'Reading'
    },
    {
        question: "What is your shipping policy?",
        answer: "Physical books are shipped within 2-3 business days. Delivery takes 5-7 business days.",
        category:'Shipping'
    },
    {
        question: "Do you have a subscription plan?",
        answer: "Yes! Our 'Book Club' subscription gives you access to unlimited e-books. Cancel anytime.",
        category:'Purchasing'
    },
    {
        question: "How do I contact customer support?",
        answer: "Email us at support@bookstore.com ",
        category:'Account'
    }
];

const FAQ_DATA_FA = [
    {
        question: "چگونه می‌توانم یک کتاب خریداری کنم؟",
        answer: "کافی است مجموعه کتاب‌ها را بررسی کنید، کتاب مورد نظر خود را انتخاب کرده و روی «افزودن به سبد» کلیک کنید. سپس با ورود به سبد خرید فرایند تسویه و پرداخت را نهایی کنید.",
        category: 'Purchasing'
    },
    {
        question: "از چه روش‌های پرداختی پشتیبانی می‌شود؟",
        answer: "کلیه کارت‌های شتاب بانکی از طریق درگاه امن شاپرک و همچنین اعتبار کیف پول درون‌برنامه‌ای پذیرفته می‌شوند.",
        category: 'Purchasing'
    },
    {
        question: "چگونه به کتاب‌های الکترونیکی و صوتی خریداری‌شده دسترسی داشته باشم؟",
        answer: "پس از پرداخت، کتاب‌ها فوراً در بخش «کتابخانه من» و داشبورد کاربری در دسترس خواهند بود و در کتاب‌خوان و پخش‌کننده آنلاین قابل اجرا هستند.",
        category: 'Reading'
    },
    {
        question: "آیا امکان بازگشت یا تعویض کتاب وجود دارد؟",
        answer: "کتاب‌های چاپی تا ۷ روز پس از تحویل در صورت سلامت فیزیکی قابل مرجوعی هستند. محصولات دیجیتال تنها در صورت نقص فنی غیرقابل رفع بازپرداخت می‌شوند.",
        category: 'Purchasing'
    },
    {
        question: "چگونه یک حساب کاربری جدید ایجاد کنم؟",
        answer: "به صفحه «ثبت نام» بروید، نام کاربری و ایمیل خود را وارد نمایید و حساب کاربری خود را فعال کنید.",
        category: 'Account'
    },
    {
        question: "چگونه رمز عبور خود را بازنشانی کنم؟",
        answer: "در صفحه ورود، روی «فراموشی رمز عبور» کلیک کنید، آدرس ایمیل خود را درج کرده تا لینک بازیابی ارسال شود.",
        category: 'Account'
    },
    {
        question: "آیا تخفیف دانشجویی ارائه می‌دهید؟",
        answer: "بله! دانشجویان با ارسال مدارک تحصیلی از ۲۰ درصد تخفیف همیشگی روی کلیه کتاب‌های دیجیتال بهره‌مند خواهند شد.",
        category: 'Account'
    },
    {
        question: "چگونه برای کتاب‌ها دیدگاه و امتیاز ثبت کنم؟",
        answer: "در صفحه اختصاصی هر کتاب، در بخش نظرات می‌توانید نقد و نظر خود را بنویسید (نیاز به ورود به حساب کاربری دارد).",
        category: 'Reading'
    },
    {
        question: "آیا آخرین صفحه مطالعه‌شده ذخیره می‌شود؟",
        answer: "بله! کتاب‌خوان هوشمند پیج‌نت آخرین صفحه مطالعه‌شده و یادداشت‌های شما را در سرور ذخیره و همگام می‌کند.",
        category: 'Reading'
    },
    {
        question: "مدت زمان ارسال کتاب‌های فیزیکی چقدر است؟",
        answer: "سفارش‌های فیزیکی طی ۲ الی ۳ روز کاری بسته‌بندی شده و با پست پیشتاز تحویل داده می‌شوند.",
        category: 'Shipping'
    },
    {
        question: "آیا امکان تهیه اشتراک نامحدود وجود دارد؟",
        answer: "بله! با اشتراک باشگاه کتاب پیج‌نت دسترسی نامحدود به کاتالوگ عظیم کتاب‌های الکترونیکی و صوتی خواهید داشت.",
        category: 'Purchasing'
    },
    {
        question: "چگونه با پشتیبانی سامانه تماس بگیرم؟",
        answer: "شما می‌توانید به نشانی support@pagenet.com ایمیل بزنید یا از بخش تیکت پشتیبانی داشبورد پیام دهید.",
        category: 'Account'
    }
];

// ============================================
//      Main
// ============================================
const FAQ = () => {
    const { isPersian } = useLanguage();

    // ---State---
    const [openIndex, setOpenIndex] = useState(null);
    const[activeCategory,setActiveCategory] = useState('All');
    const faqRef = useRef([]);

    // ---Memoized Data---
    const faqs = useMemo(() => isPersian ? FAQ_DATA_FA : FAQ_DATA, [isPersian]);




    // ---Handlers---
    const toggleQuestion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    const getFirstQuestionIndexByCategory = (category) => {
        if (category === 'All') return 0;
        return faqs.findIndex(faq => faq.category === category);
    };

    const handleCategoryClick = (category)=>{
        
        setActiveCategory(category);

        const firstQuestion = getFirstQuestionIndexByCategory(category);

        if(firstQuestion !== -1){

            setOpenIndex(null);

            setTimeout(()=>{
                setOpenIndex(firstQuestion);

                if(faqRef.current[firstQuestion]){
                    faqRef.current[firstQuestion].scrollIntoView({
                        behavior: 'smooth',
                        block: 'start' 
                    })
                }
            },100);
        }
    }

    // ---Derived State---
    const getFilteredFaqs = useMemo(() => {
        if (activeCategory === 'All'){
            return faqs;
        }
        return faqs.filter(faq=> faq.category === activeCategory)
    },[faqs,activeCategory])



    const filteredFaqs = getFilteredFaqs;
    const displayedFaqs = activeCategory === 'All' ? faqs : filteredFaqs;

    const getDisplayedIndices = () => {
        if (activeCategory === 'All') {
            return faqs.map((_, idx) => idx);
        }
        return faqs
            .map((faq, idx) => faq.category === activeCategory ? idx : -1)
            .filter(idx => idx !== -1);
    };

    const displayedIndices = getDisplayedIndices();






    return (
        <div className="faq-container" style={{ direction: isPersian ? 'rtl' : 'ltr' }}>
            <div className="faq-content">
                {/* Header */}
                <div className="faq-header">
                    <Link to="/home" className="faq-back-home">
                        {isPersian ? 'بازگشت به خانه' : 'Back to Home'}
                    </Link>
                    <h1>{isPersian ? 'پرسش‌های متداول' : 'Frequently Asked Questions'}</h1>
                    <p>{isPersian ? 'پاسخ به سوالات پرتکرار کاربران درباره خرید و استفاده از سامانه' : 'Find answers to common questions about our bookstore'}</p>
                </div>

                
                {/* Categories */}
                <div className="faq-categories">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`faq-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(cat.id)}
                        >
                            {cat[isPersian ? 'fa' : 'en']}
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div className="faq-list">
                    {displayedFaqs.map((faq, displayIndex) => {
                        const originalIndex = displayedIndices[displayIndex];
                        return (
                            <div 
                              key={originalIndex} 
                              ref={el => faqRef.current[originalIndex] = el}
                              className={`faq-item ${openIndex === originalIndex ? 'active' : ''}`}
                            >
                                <div 
                                  className="faq-question"
                                  onClick={() => toggleQuestion(originalIndex)}
                                >
                                    <h3>{faq.question}</h3>
                                    <span className="faq-icon">
                                        {openIndex === originalIndex ? '−' : '+'}
                                    </span>
                                </div>
                                {openIndex === originalIndex && (
                                    <div className="faq-answer">
                                        <p>{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="faq-footer">
                    <p>{isPersian ? 'هنوز سوال دیگری دارید؟' : 'Still have questions?'}</p>
                    <Link to="/contact" className="faq-contact-btn">
                        {isPersian ? 'ارتباط با پشتیبانی' : 'Admin Support'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FAQ;