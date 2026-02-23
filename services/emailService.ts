import emailjs from '@emailjs/browser';

export const sendPickupConfirmation = async (
  toEmail: string,
  toName: string,
  item: string,
  address: string,
  pickupTime: string,
  driverName: string
): Promise<void> => {
  try {
    console.log("Sending email to:", toEmail);
    const result = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        to_email: toEmail,
        to_name: toName,
        item,
        address,
        pickup_time: new Date(pickupTime).toLocaleString(),
        driver_name: driverName,
      },
      {
        publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY, // 👈 pass as object
      }
    );
    console.log("Email sent successfully:", result);
  } catch (err) {
    console.error("EmailJS error:", err);
    throw err;
  }
};