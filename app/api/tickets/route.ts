import { NextRequest, NextResponse } from "next/server";
import { getCustomerByEmail, createCustomer, createTicket } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subject, description, priority } = body;

    if (!email || !subject || !description || !priority) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Get or create customer
    let customer = getCustomerByEmail(email) as { Customer_ID: number } | undefined;
    let customerId: number;

    if (!customer) {
      const name = email.split("@")[0];
      customerId = createCustomer(name, email) as number;
    } else {
      customerId = customer.Customer_ID;
    }

    // Create ticket
    const ticketId = createTicket(customerId, subject, description, priority);

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Ticket created successfully",
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
