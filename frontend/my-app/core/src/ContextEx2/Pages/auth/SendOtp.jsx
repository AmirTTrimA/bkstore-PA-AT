import AuthService from "../../Services/AuthService";

/**
 * Sends a 6-digit OTP code to the specified email or username via the backend API.
 * @param {string} userEmailOrUsername - User's email address or username.
 * @returns {Promise<boolean>} True if OTP was requested successfully.
 */
export const SendOtp = async (userEmailOrUsername) => {
  try {
    const res = await AuthService.requestOtp({
      username_or_email: userEmailOrUsername,
    });
    return res.status === 200;
  } catch (error) {
    console.error("Failed to send OTP via backend API:", error);
    return false;
  }
};

export default SendOtp;
