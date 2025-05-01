import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';

// Configure Mailgen with LMCS branding
const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: "LMCS Research Portal",
    link: 'https://lmcs-research.org', // Your actual domain
    logo: 'https://lmcs-research.org/logo.png', // Your actual logo URL
    copyright: '© 2024 LMCS Laboratory. All rights reserved.'
  }
});

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Generate email content
    const emailContent = {
      body: {
        name,
        intro: 'Welcome to LMCS Research Portal!',
        action: {
          instructions: 'To complete your registration, please click here:',
          button: {
            color: '#22c55e', // Green color
            text: 'Confirm your email',
            link: 'https://lmcs-research.org/confirm' // Your actual confirmation link
          }
        },
        outro: 'Need help? Reply to this email.'
      }
    };

    const emailBody = mailGenerator.generate(emailContent);
    const emailText = mailGenerator.generatePlaintext(emailContent);

    // Create transporter (using Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD, // Use app-specific password
      },
    });

    // Send mail
    await transporter.sendMail({
      from: `LMCS Research <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Welcome to LMCS Research Portal',
      html: emailBody,
      text: emailText,
    });

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}