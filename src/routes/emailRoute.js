import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.hostinger.com",
      port: 587, // IMPORTANT: Vercel requires 587
      secure: false, // TLS
      auth: {
        user: "info@skinmuse.pk",
        pass: process.env.EMAIL_PASS || "Sheetno2@", // use .env
      },
    });

    const mailOptions = {
      from: `"${name}" <${"info@skinmuse.pk"}>`, // ALWAYS use your domain email
      replyTo: email, // store visitor email safely
      to: "info@skinmuse.pk",
      subject: `New Contact Message from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Email sent successfully!" });

  } catch (err) {
    console.error("Email Error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

export default router;
