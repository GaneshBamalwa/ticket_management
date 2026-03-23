import { NextRequest, NextResponse } from "next/server";
import { addConversationMessage, getTicketById } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const ticket = getTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = await request.json();
    const { message, senderRole = "Customer" } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    addConversationMessage(ticketId, senderRole, message);

    return NextResponse.json({
      success: true,
      message: {
        Message_ID: Date.now(),
        Ticket_ID: ticketId,
        Sender_Role: senderRole,
        Message_Text: message,
        Timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error adding message:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
}
