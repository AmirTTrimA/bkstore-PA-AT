// ✅
import emailjs from "emailjs-com"




// ============================================
//    Constants
// ============================================
const SERVICE_ID = "service_zt7yky5";
const TEMPLATE_ID = "template_umfz3l5";
const PUBLIC_KEY = "2OmvEVGag2HVCj8Ri";



// ============================================
//      Main 
// ============================================
export const  SendOtp =async(userEmail,otp) =>{

    try {
        await emailjs.send(
          SERVICE_ID,
          TEMPLATE_ID,
          {
            to_email: userEmail,
            from_name: "HeiDar",
            name: "User",
            message: otp.toString()
          },
          PUBLIC_KEY
        );
        return true;
      } catch (error) {
        console.error("Failed to send OTP:", error);
        return false;
      }
    };
