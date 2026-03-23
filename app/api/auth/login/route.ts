import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAgentByEmail } from "@/lib/db";

interface Agent {
  Agent_ID: number;
  Name: string;
  Email_ID: string;
  Role: string;
  Password: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const agent = getAgentByEmail(email.trim()) as Agent | undefined;

    if (!agent) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // If agent has no password, allow login for password setup
    if (!agent.Password) {
      const response = NextResponse.json({
        success: true,
        requiresPasswordSetup: true,
        user: {
          id: agent.Agent_ID,
          name: agent.Name,
          email: agent.Email_ID,
          role: agent.Role,
        },
      });
      return response;
    }

    // Verify password
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 401 }
      );
    }

    const isValid = bcrypt.compareSync(password, agent.Password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: agent.Agent_ID,
        name: agent.Name,
        email: agent.Email_ID,
        role: agent.Role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
