from flask import Flask, flash, render_template, request, redirect, url_for, session, jsonify
import sqlite3
from datetime import datetime
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import hashlib
import urllib.request
import json as _json

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'change_this_in_production')

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DB_PATH = os.path.join(os.getcwd(), "support_portal.db")

GROQ_API_KEY = "USE YOUR OWN KEY HERE"

SMTP_HOST  = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT  = int(os.environ.get("SMTP_PORT", 587))
# Leave these empty to skip email functionality for now
SMTP_USER  = ""
SMTP_PASS  = ""
EMAIL_FROM = "support@yourcompany.com"

# ─── DB HELPER ────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn, conn.cursor()

def init_db():
    """Initialize the database with tables if they don't exist."""
    print(f"Initializing database at {DB_PATH}")
    conn, cursor = get_db()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS Customers (
            Customer_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name        TEXT,
            Email_ID    TEXT UNIQUE
        );

        CREATE TABLE IF NOT EXISTS Support_Agents (
            Agent_ID  INTEGER PRIMARY KEY AUTOINCREMENT,
            Name      TEXT,
            Email_ID  TEXT UNIQUE,
            Role      TEXT, 
            Password  TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS Tickets (
            Ticket_ID      INTEGER PRIMARY KEY AUTOINCREMENT,
            Customer_ID    INTEGER,
            Agent_ID       INTEGER NULL,
            Subject        TEXT,
            Description    TEXT,
            Status         TEXT DEFAULT 'Open',
            Priority       TEXT,
            FollowUpCount  INTEGER DEFAULT 0,
            Rating         INTEGER NULL,
            Created_Date   DATETIME DEFAULT CURRENT_TIMESTAMP,
            Assigned_At    DATETIME NULL,
            Resolved_At    DATETIME NULL,
            Due_Date       DATETIME NULL,
            FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_ID),
            FOREIGN KEY (Agent_ID)    REFERENCES Support_Agents(Agent_ID)
        );

        CREATE TABLE IF NOT EXISTS Ticket_Conversations (
            Message_ID   INTEGER PRIMARY KEY AUTOINCREMENT,
            Ticket_ID    INTEGER,
            Sender_Role  TEXT,
            Message_Text TEXT NOT NULL,
            Timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (Ticket_ID) REFERENCES Tickets(Ticket_ID)
        );

        CREATE TABLE IF NOT EXISTS Password_Change_Requests (
            Request_ID   INTEGER PRIMARY KEY AUTOINCREMENT,
            Agent_ID     INTEGER NOT NULL,
            Status       TEXT DEFAULT 'Pending',
            Requested_At DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (Agent_ID) REFERENCES Support_Agents(Agent_ID)
        );

        INSERT OR IGNORE INTO Support_Agents (Name, Email_ID, Role)
        VALUES ('Admin', 'admin@example.com', 'Administrator');
    """)
    conn.commit()
    conn.close()

# ─── EMAIL HELPER ─────────────────────────────────────────────────────────────
def send_email(to_addr: str, subject: str, body_html: str):
    if not SMTP_USER: return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = EMAIL_FROM
        msg["To"]      = to_addr
        msg.attach(MIMEText(body_html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=5) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM, to_addr, msg.as_string())
    except: pass

# ─── PASSWORD HELPERS ─────────────────────────────────────────────────────────
def hash_password(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()

def check_password(raw: str, hashed: str) -> bool:
    return hash_password(raw) == hashed

# ─── CUSTOMER ACTIONS ─────────────────────────────────────────────────────────
@app.route('/follow_up/<int:ticket_id>')
def follow_up(ticket_id):
    conn, cursor = get_db()
    cursor.execute("UPDATE Tickets SET FollowUpCount = FollowUpCount + 1, Status = 'Open' WHERE Ticket_ID = ?", (ticket_id,))
    conn.commit()
    cursor.execute("SELECT t.Subject, c.Email_ID AS customer_email, a.Email_ID AS agent_email FROM Tickets t LEFT JOIN Customers c ON t.Customer_ID = c.Customer_ID LEFT JOIN Support_Agents a ON t.Agent_ID = a.Agent_ID WHERE t.Ticket_ID = ?", (ticket_id,))
    row = cursor.fetchone()
    conn.close()
    if row and row['agent_email']:
        send_email(row['agent_email'], f"[Follow-Up] Ticket #{ticket_id}: {row['Subject']}", f"<p>Follow-up on #{ticket_id}.</p>")
    flash("Follow-up sent!", "info")
    return redirect(url_for('home'))

@app.route('/search_history', methods=['POST'])
def search_history():
    email = request.form.get('search_email')
    f_status = request.form.get('filter_status')
    f_prio = request.form.get('filter_priority')
    conn, cursor = get_db()
    cursor.execute("SELECT Customer_ID, Name FROM Customers WHERE Email_ID = ?", (email,))
    customer = cursor.fetchone()
    history = []
    if customer:
        query = "SELECT * FROM Tickets WHERE Customer_ID = ?"
        params = [customer['Customer_ID']]
        if f_status: query += " AND Status = ?"; params.append(f_status)
        if f_prio: query += " AND Priority = ?"; params.append(f_prio)
        query += " ORDER BY Ticket_ID DESC"
        cursor.execute(query, params)
        history = [dict(r) for r in cursor.fetchall()]
    
    agents = []
    if 'user' in session:
        cursor.execute("SELECT Agent_ID, Name FROM Support_Agents WHERE Role='Agent'")
        agents = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    if 'user' in session:
        return render_template('dashboard.html', tickets=history, user=session['user'], agents=agents, is_search=True, last_email=email, pw_requests=[], now=datetime.now())
    return render_template('raise_ticket.html', history=history, customer_name=customer['Name'] if customer else "", last_email=email)

# ─── CORE TICKETING ───────────────────────────────────────────────────────────
@app.route('/')
def home():
    return render_template('raise_ticket.html', history=[], customer_name="")

@app.route('/raise_ticket', methods=['POST'])
def raise_ticket():
    email = request.form.get('email')
    subject = request.form.get('subject')
    desc = request.form.get('description')
    prio = request.form.get('priority')
    conn, cursor = get_db()
    cursor.execute("SELECT Customer_ID FROM Customers WHERE Email_ID = ?", (email,))
    customer = cursor.fetchone()
    if not customer:
        cursor.execute("INSERT INTO Customers (Name, Email_ID) VALUES (?, ?)", (email.split('@')[0], email))
        customer_id = cursor.lastrowid
    else:
        customer_id = customer['Customer_ID']
    cursor.execute("INSERT INTO Tickets (Customer_ID, Subject, Description, Priority, Status, FollowUpCount, Created_Date) VALUES (?, ?, ?, ?, 'Open', 0, CURRENT_TIMESTAMP)", (customer_id, subject, desc, prio))
    ticket_id = cursor.lastrowid
    conn.commit()
    conn.close()
    flash("Ticket raised successfully!", "success")
    return redirect(url_for('home'))

@app.route('/ticket/<int:ticket_id>/conversation', methods=['GET', 'POST'])
def ticket_conversation(ticket_id):
    conn, cursor = get_db()
    cursor.execute("SELECT * FROM Tickets WHERE Ticket_ID = ?", (ticket_id,))
    ticket = cursor.fetchone()
    if not ticket: return "Ticket not found", 404
    ticket = dict(ticket)
    if request.method == 'POST' and ticket['Status'] == 'Open':
        msg_text = request.form.get('message')
        user = session.get('user')
        role = user['Role'] if user else 'Customer'
        cursor.execute("INSERT INTO Ticket_Conversations (Ticket_ID, Sender_Role, Message_Text, Timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", (ticket_id, role, msg_text))
        conn.commit()
        return redirect(url_for('ticket_conversation', ticket_id=ticket_id))
    cursor.execute("SELECT * FROM Ticket_Conversations WHERE Ticket_ID = ? ORDER BY Timestamp ASC", (ticket_id,))
    messages = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return render_template('conversation.html', ticket=ticket, messages=messages)

# ─── STAFF DASHBOARD ──────────────────────────────────────────────────────────
@app.route('/dashboard')
def dashboard():
    if 'user' not in session: return redirect(url_for('login_page'))
    user = session['user']
    f_status = request.args.get('status')
    f_prio = request.args.get('priority')
    f_date = request.args.get('date')
    conn, cursor = get_db()
    query = "SELECT t.*, (SELECT Message_Text FROM Ticket_Conversations WHERE Ticket_ID = t.Ticket_ID ORDER BY Timestamp DESC LIMIT 1) as last_message FROM Tickets t WHERE 1=1"
    params = []
    if user['Role'] != 'Administrator':
        query += " AND (Agent_ID = ? OR Agent_ID IS NULL)"; params.append(user['Agent_ID'])
    if f_status: query += " AND Status = ?"; params.append(f_status)
    if f_prio: query += " AND Priority = ?"; params.append(f_prio)
    if f_date: query += " AND date(Created_Date) = ?"; params.append(f_date)
    query += " ORDER BY FollowUpCount DESC, Ticket_ID DESC"
    cursor.execute(query, params)
    tickets = [dict(r) for r in cursor.fetchall()]
    cursor.execute("SELECT Agent_ID, Name FROM Support_Agents WHERE Role='Agent'")
    agents = [dict(r) for r in cursor.fetchall()]
    pw_requests = []
    if user['Role'] == 'Administrator':
        cursor.execute("SELECT r.*, a.Name, a.Email_ID FROM Password_Change_Requests r JOIN Support_Agents a ON r.Agent_ID = a.Agent_ID WHERE r.Status = 'Pending' ORDER BY r.Requested_At DESC")
        pw_requests = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return render_template('dashboard.html', tickets=tickets, user=user, agents=agents, is_search=False, pw_requests=pw_requests, now=datetime.now())

@app.route('/admin_report')
def admin_report():
    if 'user' not in session or session['user']['Role'] != 'Administrator': return redirect(url_for('dashboard'))
    conn, cursor = get_db()
    cursor.execute("SELECT COUNT(*) as total, SUM(CASE WHEN Status='Resolved' THEN 1 ELSE 0 END) as resolved, SUM(CASE WHEN Status='Open' THEN 1 ELSE 0 END) as pending, ROUND(AVG(CASE WHEN Rating IS NOT NULL THEN Rating END), 1) as avg_rating FROM Tickets")
    stats = cursor.fetchone()
    stats = dict(stats) if stats else {}
    cursor.execute("SELECT a.Name, COUNT(t.Ticket_ID) as assigned, SUM(CASE WHEN t.Status = 'Resolved' THEN 1 ELSE 0 END) as solved, ROUND(AVG(CASE WHEN t.Rating IS NOT NULL THEN t.Rating END), 1) as avg_rating FROM Support_Agents a LEFT JOIN Tickets t ON a.Agent_ID = t.Agent_ID WHERE a.Role = 'Agent' GROUP BY a.Agent_ID, a.Name")
    performance = [dict(r) for r in cursor.fetchall()]
    cursor.execute("SELECT Priority, COUNT(*) as count FROM Tickets GROUP BY Priority")
    priority_data = [dict(r) for r in cursor.fetchall()]
    cursor.execute("SELECT date(Created_Date) as day, COUNT(*) as count FROM Tickets WHERE Created_Date >= date('now', '-7 days') GROUP BY date(Created_Date) ORDER BY day ASC")
    daily_data = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return render_template('admin_report.html', stats=stats, performance=performance, priority_data=priority_data, daily_data=daily_data)

# ─── AUTH ─────────────────────────────────────────────────────────────────────
@app.route('/login_page')
def login_page(): return render_template('login.html')

@app.route('/auth', methods=['POST'])
def auth():
    email = request.form.get('email', '').strip()
    password = request.form.get('password', '')
    conn, cursor = get_db()
    cursor.execute("SELECT * FROM Support_Agents WHERE Email_ID = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    if user:
        user = dict(user)
        if not user.get('Password'):
            session['user'] = {k: v for k, v in user.items() if k != 'Password'}
            return redirect(url_for('set_password'))
        if check_password(password, user['Password']):
            session['user'] = {k: v for k, v in user.items() if k != 'Password'}
            return redirect(url_for('dashboard'))
    flash("Invalid credentials.", "danger")
    return redirect(url_for('login_page'))

@app.route('/set_password', methods=['GET', 'POST'])
def set_password():
    if 'user' not in session: return redirect(url_for('login_page'))
    user = session['user']
    change_approved = True
    if user['Role'] == 'Agent':
        conn, cursor = get_db()
        cursor.execute("SELECT Password FROM Support_Agents WHERE Agent_ID = ?", (user['Agent_ID'],))
        row = cursor.fetchone()
        if row and row['Password']:
            cursor.execute("SELECT * FROM Password_Change_Requests WHERE Agent_ID = ? AND Status = 'Approved' ORDER BY Requested_At DESC LIMIT 1", (user['Agent_ID'],))
            change_approved = bool(cursor.fetchone())
        conn.close()
    if request.method == 'POST' and change_approved:
        new_pw = request.form.get('password', '')
        conn, cursor = get_db()
        cursor.execute("UPDATE Support_Agents SET Password = ? WHERE Agent_ID = ?", (hash_password(new_pw), user['Agent_ID']))
        if user['Role'] == 'Agent':
            cursor.execute("UPDATE Password_Change_Requests SET Status = 'Done' WHERE Agent_ID = ? AND Status = 'Approved'", (user['Agent_ID'],))
        conn.commit()
        conn.close()
        return redirect(url_for('dashboard'))
    return render_template('set_password.html', change_approved=change_approved, user=user)

@app.route('/assign_ticket/<int:ticket_id>', methods=['POST'])
def assign_ticket(ticket_id):
    if 'user' not in session or session['user']['Role'] != 'Administrator': return redirect(url_for('dashboard'))
    agent_id = request.form.get('agent_id') or None
    conn, cursor = get_db()
    if agent_id:
        cursor.execute("SELECT Priority FROM Tickets WHERE Ticket_ID = ?", (ticket_id,))
        ticket = cursor.fetchone()
        due_hours = {'High': 24, 'Medium': 48, 'Low': 72}.get(ticket['Priority'], 48)
        cursor.execute(f"UPDATE Tickets SET Agent_ID = ?, Assigned_At = CURRENT_TIMESTAMP, Due_Date = datetime('now', '+{due_hours} hours') WHERE Ticket_ID = ?", (agent_id, ticket_id))
    else:
        cursor.execute("UPDATE Tickets SET Agent_ID = NULL, Assigned_At = NULL, Due_Date = NULL WHERE Ticket_ID = ?", (ticket_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('dashboard'))

@app.route('/resolve_ticket/<int:ticket_id>')
def resolve_ticket(ticket_id):
    if 'user' not in session: return redirect(url_for('login_page'))
    conn, cursor = get_db()
    cursor.execute("UPDATE Tickets SET Status = 'Resolved', Resolved_At = CURRENT_TIMESTAMP WHERE Ticket_ID = ?", (ticket_id,))
    conn.commit()
    conn.close()
    flash("Resolved!", "success")
    return redirect(url_for('dashboard'))

@app.route('/rate_ticket/<int:ticket_id>/<int:rating>')
def rate_ticket(ticket_id, rating):
    conn, cursor = get_db()
    cursor.execute("UPDATE Tickets SET Rating = ? WHERE Ticket_ID = ? AND Status = 'Resolved'", (rating, ticket_id))
    conn.commit()
    conn.close()
    return redirect(url_for('home'))

@app.route('/ai_suggest', methods=['POST'])
def ai_suggest():
    return jsonify({'suggestion': 'AI functionality requires API key setting in app.py.'})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
