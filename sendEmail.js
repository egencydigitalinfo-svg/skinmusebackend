import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html, replyTo }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.hostinger.com",
      port: process.env.EMAIL_PORT || 465,
      secure: true, // SSL
      auth: {
        user: process.env.EMAIL_USER || "sales@skinmuse.pk",
        pass: process.env.EMAIL_PASS || "Sheetno1@", // use .env
      },
    });

    const mailOptions = {
      from: `"Skin Muse" <${process.env.EMAIL_USER || "sales@skinmuse.pk"}>`,
      to,
      replyTo, // optional, e.g., customer's email
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("sendEmail Error:", err);
    throw err;
  }
};

export default sendEmail;
