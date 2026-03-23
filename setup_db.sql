CREATE DATABASE IF NOT EXISTS CustomerSupportDB;
USE CustomerSupportDB;

-- Stores customer profiles (auto-created on first ticket submission)
CREATE TABLE IF NOT EXISTS Customers (
    Customer_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name        VARCHAR(100),
    Email_ID    VARCHAR(100) UNIQUE
);

-- Stores staff accounts with hashed passwords and roles
CREATE TABLE IF NOT EXISTS Support_Agents (
    Agent_ID  INT AUTO_INCREMENT PRIMARY KEY,
    Name      VARCHAR(100),
    Email_ID  VARCHAR(100) UNIQUE,
    Role      ENUM('Agent', 'Administrator'),
    Password  VARCHAR(64) NULL
);

-- Core tickets table with SLA tracking columns
CREATE TABLE IF NOT EXISTS Tickets (
    Ticket_ID      INT AUTO_INCREMENT PRIMARY KEY,
    Customer_ID    INT,
    Agent_ID       INT NULL,
    Subject        VARCHAR(255),
    Description    TEXT,
    Status         VARCHAR(20) DEFAULT 'Open',
    Priority       VARCHAR(20),
    FollowUpCount  INT DEFAULT 0,
    Rating         TINYINT NULL,
    Created_Date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Assigned_At    DATETIME NULL,
    Resolved_At    DATETIME NULL,
    Due_Date       DATETIME NULL,
    FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID),
    FOREIGN KEY (Agent_ID)    REFERENCES Support_Agents(Agent_ID)
);

-- Per-ticket conversation messages
CREATE TABLE IF NOT EXISTS Ticket_Conversations (
    Message_ID   INT AUTO_INCREMENT PRIMARY KEY,
    Ticket_ID    INT,
    Sender_Role  ENUM('Customer', 'Agent', 'Administrator'),
    Message_Text TEXT NOT NULL,
    Timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Ticket_ID) REFERENCES Tickets(Ticket_ID)
);

-- Admin-gated password change requests from agents
CREATE TABLE IF NOT EXISTS Password_Change_Requests (
    Request_ID   INT AUTO_INCREMENT PRIMARY KEY,
    Agent_ID     INT NOT NULL,
    Status       ENUM('Pending', 'Approved', 'Denied', 'Done') DEFAULT 'Pending',
    Requested_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Agent_ID) REFERENCES Support_Agents(Agent_ID)
);

-- Insert first administrator account
INSERT INTO Support_Agents (Name, Email_ID, Role)
SELECT 'Admin', 'admin@example.com', 'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM Support_Agents WHERE Email_ID = 'admin@example.com');
