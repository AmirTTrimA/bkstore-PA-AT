









// book (container + stragged child animate)
  export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3, 
        staggerDirection: 1, // 1= left to right -1= right to left
      },
    },
  };

// book (individual card element)
  export const cardVariants = {
    hidden: {opacity: 0 ,scale:0.3},
    visible: {
      opacity: 1,
      scale:1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 10,
        
      },
    },
  };







  
// home introduce-cards 
  export const numberVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10,
        delay: 0.5,
      },
    },
  };

  // home header-cards
  export const ux_TitleVariants = {
    hidden: { y:100 },
    visible: {
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 50,
        delay: 0.5,
      },
    },
  };