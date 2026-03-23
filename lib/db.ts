import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "support_portal.db");

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initDb();
  }
  return db;
}

function initDb() {
  const database = getDb();

  // Create tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS Customers (
      Customer_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT,
      Email_ID TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS Support_Agents (
      Agent_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT,
      Email_ID TEXT UNIQUE,
      Role TEXT,
      Password TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS Tickets (
      Ticket_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Customer_ID INTEGER,
      Agent_ID INTEGER NULL,
      Subject TEXT,
      Description TEXT,
      Status TEXT DEFAULT 'Open',
      Priority TEXT,
      FollowUpCount INTEGER DEFAULT 0,
      Rating INTEGER NULL,
      Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      Assigned_At DATETIME NULL,
      Resolved_At DATETIME NULL,
      Due_Date DATETIME NULL
    );

    CREATE TABLE IF NOT EXISTS Ticket_Conversations (
      Message_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Ticket_ID INTEGER,
      Sender_Role TEXT,
      Message_Text TEXT,
      Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Password_Change_Requests (
      Request_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Agent_ID INTEGER,
      Status TEXT DEFAULT 'Pending',
      Requested_At DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed initial agents
  const agents = [
    { name: "Admin", email: "admin@support.com", role: "Administrator", password: "admin1234" },
    { name: "Ganesh", email: "ganesh@support.com", role: "Agent", password: "ganesh123" },
    { name: "Rudransh", email: "rudransh@support.com", role: "Agent", password: "rudransh123" },
  ];

  const checkStmt = database.prepare("SELECT Agent_ID FROM Support_Agents WHERE Email_ID = ?");
  const insertStmt = database.prepare(
    "INSERT INTO Support_Agents (Name, Email_ID, Role, Password) VALUES (?, ?, ?, ?)"
  );

  for (const agent of agents) {
    const existing = checkStmt.get(agent.email);
    if (!existing) {
      const hashedPassword = bcrypt.hashSync(agent.password, 10);
      insertStmt.run(agent.name, agent.email, agent.role, hashedPassword);
    }
  }
}

// Export helper functions
export function getCustomerByEmail(email: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM Customers WHERE Email_ID = ?").get(email);
}

export function createCustomer(name: string, email: string) {
  const db = getDb();
  const result = db.prepare("INSERT INTO Customers (Name, Email_ID) VALUES (?, ?)").run(name, email);
  return result.lastInsertRowid;
}

export function createTicket(
  customerId: number,
  subject: string,
  description: string,
  priority: string
) {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO Tickets (Customer_ID, Subject, Description, Priority, Status) VALUES (?, ?, ?, ?, 'Open')"
    )
    .run(customerId, subject, description, priority);
  return result.lastInsertRowid;
}

export function getTicketsByCustomerId(customerId: number) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM Tickets WHERE Customer_ID = ? ORDER BY Ticket_ID DESC")
    .all(customerId);
}

export function getTicketById(ticketId: number) {
  const db = getDb();
  return db.prepare("SELECT * FROM Tickets WHERE Ticket_ID = ?").get(ticketId);
}

export function getConversationsByTicketId(ticketId: number) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM Ticket_Conversations WHERE Ticket_ID = ? ORDER BY Timestamp ASC")
    .all(ticketId);
}

export function addConversationMessage(ticketId: number, senderRole: string, message: string) {
  const db = getDb();
  return db
    .prepare(
      "INSERT INTO Ticket_Conversations (Ticket_ID, Sender_Role, Message_Text) VALUES (?, ?, ?)"
    )
    .run(ticketId, senderRole, message);
}

export function getAgentByEmail(email: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM Support_Agents WHERE Email_ID = ?").get(email);
}

export function getAllTickets(agentId?: number, role?: string) {
  const db = getDb();
  if (role === "Administrator") {
    return db.prepare("SELECT * FROM Tickets ORDER BY FollowUpCount DESC, Ticket_ID DESC").all();
  }
  return db
    .prepare(
      "SELECT * FROM Tickets WHERE Agent_ID = ? OR Agent_ID IS NULL ORDER BY FollowUpCount DESC, Ticket_ID DESC"
    )
    .all(agentId);
}
