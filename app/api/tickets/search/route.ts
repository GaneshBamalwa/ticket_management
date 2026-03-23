import { NextRequest, NextResponse } from "next/server";
import { getCustomerByEmail, getTicketsByCustomerId } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const customer = getCustomerByEmail(email) as { Customer_ID: number } | undefined;

    if (!customer) {
      return NextResponse.json({ tickets: [] });
    }

    const tickets = getTicketsByCustomerId(customer.Customer_ID);

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error searching tickets:", error);
    return NextResponse.json(
      { error: "Failed to search tickets" },
      { status: 500 }
    );
  }
}
