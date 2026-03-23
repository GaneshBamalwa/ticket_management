import { getTicketById, getConversationsByTicketId } from "@/lib/db";
import { notFound } from "next/navigation";
import { ConversationView } from "@/components/conversation-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Ticket {
  Ticket_ID: number;
  Subject: string;
  Description: string;
  Status: string;
  Priority: string;
  Rating: number | null;
}

interface Message {
  Message_ID: number;
  Ticket_ID: number;
  Sender_Role: string;
  Message_Text: string;
  Timestamp: string;
}

export default async function TicketPage({ params }: PageProps) {
  const { id } = await params;
  const ticketId = parseInt(id, 10);

  if (isNaN(ticketId)) {
    notFound();
  }

  const ticket = getTicketById(ticketId) as Ticket | undefined;

  if (!ticket) {
    notFound();
  }

  const messages = getConversationsByTicketId(ticketId) as Message[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <ConversationView ticket={ticket} messages={messages} />
    </div>
  );
}
