// In-memory data store for demo purposes
// Replace with a real database integration (Supabase, Neon, etc.) for production

export interface Customer {
  Customer_ID: number;
  Name: string;
  Email_ID: string;
}

export interface Ticket {
  Ticket_ID: number;
  Customer_ID: number;
  Agent_ID: number | null;
  Subject: string;
  Description: string;
  Status: string;
  Priority: string;
  FollowUpCount: number;
  Rating: number | null;
  Created_Date: string;
  Assigned_At: string | null;
  Resolved_At: string | null;
  Due_Date: string | null;
}

export interface Conversation {
  Message_ID: number;
  Ticket_ID: number;
  Sender_Role: string;
  Message_Text: string;
  Timestamp: string;
}

export interface Agent {
  Agent_ID: number;
  Name: string;
  Email_ID: string;
  Role: string;
  Password: string;
}

// In-memory data stores
const customers: Customer[] = [];
const tickets: Ticket[] = [];
const conversations: Conversation[] = [];
const agents: Agent[] = [
  { Agent_ID: 1, Name: "Admin", Email_ID: "admin@support.com", Role: "Administrator", Password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.S3ksWQhWZYz0aSrp7S" }, // admin1234
  { Agent_ID: 2, Name: "Ganesh", Email_ID: "ganesh@support.com", Role: "Agent", Password: "$2a$10$YJPJwgqPX8qPwpOQk2jVq.KBsGxIH3qwOz8xVOoQHOEh8g4IzVVHm" }, // ganesh123
  { Agent_ID: 3, Name: "Rudransh", Email_ID: "rudransh@support.com", Role: "Agent", Password: "$2a$10$rNbWLWR4VLmCqnpLeqVW3.U4hVuGpKi0HY0JqK8wJW5qYOZOJKrQK" }, // rudransh123
];

let customerIdCounter = 1;
let ticketIdCounter = 1;
let conversationIdCounter = 1;

export function getCustomerByEmail(email: string): Customer | undefined {
  return customers.find((c) => c.Email_ID === email);
}

export function createCustomer(name: string, email: string): number {
  const customer: Customer = {
    Customer_ID: customerIdCounter++,
    Name: name,
    Email_ID: email,
  };
  customers.push(customer);
  return customer.Customer_ID;
}

export function createTicket(
  customerId: number,
  subject: string,
  description: string,
  priority: string
): number {
  const ticket: Ticket = {
    Ticket_ID: ticketIdCounter++,
    Customer_ID: customerId,
    Agent_ID: null,
    Subject: subject,
    Description: description,
    Status: "Open",
    Priority: priority,
    FollowUpCount: 0,
    Rating: null,
    Created_Date: new Date().toISOString(),
    Assigned_At: null,
    Resolved_At: null,
    Due_Date: null,
  };
  tickets.push(ticket);
  return ticket.Ticket_ID;
}

export function getTicketsByCustomerId(customerId: number): Ticket[] {
  return tickets
    .filter((t) => t.Customer_ID === customerId)
    .sort((a, b) => b.Ticket_ID - a.Ticket_ID);
}

export function getTicketById(ticketId: number): Ticket | undefined {
  return tickets.find((t) => t.Ticket_ID === ticketId);
}

export function getConversationsByTicketId(ticketId: number): Conversation[] {
  return conversations
    .filter((c) => c.Ticket_ID === ticketId)
    .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
}

export function addConversationMessage(
  ticketId: number,
  senderRole: string,
  message: string
): void {
  const conversation: Conversation = {
    Message_ID: conversationIdCounter++,
    Ticket_ID: ticketId,
    Sender_Role: senderRole,
    Message_Text: message,
    Timestamp: new Date().toISOString(),
  };
  conversations.push(conversation);

  // Increment follow-up count on ticket
  const ticket = tickets.find((t) => t.Ticket_ID === ticketId);
  if (ticket) {
    ticket.FollowUpCount++;
  }
}

export function getAgentByEmail(email: string): Agent | undefined {
  return agents.find((a) => a.Email_ID === email);
}

export function getAllTickets(agentId?: number, role?: string): Ticket[] {
  if (role === "Administrator") {
    return [...tickets].sort((a, b) => b.FollowUpCount - a.FollowUpCount || b.Ticket_ID - a.Ticket_ID);
  }
  return tickets
    .filter((t) => t.Agent_ID === agentId || t.Agent_ID === null)
    .sort((a, b) => b.FollowUpCount - a.FollowUpCount || b.Ticket_ID - a.Ticket_ID);
}

export function getCustomerById(customerId: number): Customer | undefined {
  return customers.find((c) => c.Customer_ID === customerId);
}
