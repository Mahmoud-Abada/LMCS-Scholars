import bcrypt from 'bcryptjs';
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import nodemailer from 'nodemailer';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  researcherId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: "researcher",
      researcherId: data.researcherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send a welcome email
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your email service provider
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: 'Welcome to LMCS Scholars',
      text: `Hello ${data.name},\n\nWelcome to LMCS Scholars! Your account has been successfully created.\n\nBest regards,\nThe LMCS Scholars Team`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 }
    );
  }
}




