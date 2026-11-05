import { NextResponse } from "next/server";

import { COMPANY } from "@/components/home/content";
import { resend } from "@/lib/resend";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";
    const website =
      typeof body?.website === "string" ? body.website.trim() : "";

    // Quietly accept automated submissions that fill the hidden honeypot.
    if (website) return NextResponse.json({ success: true });

    if (
      !name ||
      name.length > 100 ||
      !EMAIL_PATTERN.test(email) ||
      email.length > 254 ||
      message.length < 10 ||
      message.length > 3000
    ) {
      return NextResponse.json(
        { error: "Enter your name, a valid email, and a message of at least 10 characters." },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email delivery is not configured right now. Please try again later." },
        { status: 503 },
      );
    }

    const { error } = await resend.emails.send({
      from: `Rebuzz POS <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`,
      to: [COMPANY.email],
      replyTo: email,
      subject: `Website enquiry from ${name}`,
      text: `A visitor sent a message through the Rebuzz POS website.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error("Home contact email error:", error);
      return NextResponse.json(
        { error: "Your message could not be sent. Please try again later." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Home contact request failed:", error);
    return NextResponse.json(
      { error: "Your message could not be sent. Please try again later." },
      { status: 500 },
    );
  }
}
