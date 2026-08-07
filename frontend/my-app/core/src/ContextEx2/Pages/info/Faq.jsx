// ✅
import React, { useState,useRef,useMemo } from 'react';
import { Link } from 'react-router-dom';
import '../../Styles/components/Faq.css';



// ============================================
//      Constants
// ============================================
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





// ============================================
//      Main
// ============================================
const FAQ = () => {

    // ---State---
    const [openIndex, setOpenIndex] = useState(null);
    const[activeCategory,setActiveCategory] = useState('All');
    const faqRef = useRef([]);

    // ---Memoized Data---
    const faqs = useMemo(() => FAQ_DATA, []);




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
        <div className="faq-container">
            <div className="faq-content">
                {/* Header */}
                <div className="faq-header">
                    <Link to="/home" className="faq-back-home">Back to Home</Link>
                    <h1>Frequently Asked Questions</h1>
                    <p>Find answers to common questions about our bookstore</p>
                </div>

                
                {/* Catrgories */}
                <div className="faq-categories">
                    <button 
                        className={`faq-category-btn ${activeCategory === 'All' ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('All')}
                    >
                        All
                    </button>
                    
                    <button 
                        className={`faq-category-btn ${activeCategory === 'Purchasing' ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('Purchasing')}
                    >
                        Purchasing
                    </button>
                    
                    <button 
                        className={`faq-category-btn ${activeCategory === 'Account' ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('Account')}
                    >
                        Account
                    </button>

                    <button 
                        className={`faq-category-btn ${activeCategory === 'Reading' ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('Reading')}
                    >
                        Reading
                    </button>

                    <button 
                        className={`faq-category-btn ${activeCategory === 'Shipping' ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('Shipping')}
                    >
                        Shipping
                    </button>
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
                    <p>Still have questions?</p>
                    <Link to="/contact" className="faq-contact-btn">Admin Support</Link>
                </div>
            </div>
        </div>
    );
};

export default FAQ;