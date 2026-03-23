from fastapi import FastAPI, Request, Form, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
import sqlite3
import mysql.connector
import hashlib
import os
from datetime import datetime, timedelta
import json
from typing import Optional, Union

app = FastAPI()

# ─── CONFIG ───────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get('SECRET_KEY', '7056e3641a99339d6058f06f453bd1b9')
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

# Railway MySQL Config
MYSQL_HOST = os.environ.get('MYSQLHOST')
MYSQL_USER = os.environ.get('MYSQLUSER')
MYSQL_PASS = os.environ.get('MYSQLPASSWORD')
MYSQL_DB   = os.environ.get('MYSQLDATABASE')
MYSQL_PORT = os.environ.get('MYSQLPORT', '3306')

IS_MYSQL = bool(MYSQL_HOST)
DB_PATH = "support_portal.db"
PH = "%s" if IS_MYSQL else "?"

# ─── DB HELPERS ───────────────────────────────────────────────────────────────

def get_db_conn():
    if IS_MYSQL:
        return mysql.connector.connect(
            host=MYSQL_HOST, user=MYSQL_USER, password=MYSQL_PASS,
            database=MYSQL_DB, port=MYSQL_PORT, autocommit=True,
            connection_timeout=10
        )
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def execute_query(cursor, query: str, params: tuple = ()):
    # Simple syntax mapping for SQLite/MySQL cross-compatibility
    if not IS_MYSQL:
        # Map %s to ? for SQLite
        query = query.replace('%s', '?')
    cursor.execute(query, params)

def fetch_one(cursor):
    row = cursor.fetchone()
    if not row: return None
    if IS_MYSQL:
        return dict(zip(cursor.column_names, row))
    return dict(row)

def fetch_all(cursor):
    rows = cursor.fetchall()
    if IS_MYSQL:
        return [dict(zip(cursor.column_names, r)) for r in rows]
    return [dict(r) for r in rows]

def init_db():
    conn = get_db_conn(); cursor = conn.cursor()
    # Simple auto-init logic. For production MySQL, setup_db.sql is preferred.
    if IS_MYSQL:
        cursor.execute("CREATE TABLE IF NOT EXISTS Customers (Customer_ID INT AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(255), Email_ID VARCHAR(255) UNIQUE)")
        cursor.execute("CREATE TABLE IF NOT EXISTS Support_Agents (Agent_ID INT AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(255), Email_ID VARCHAR(255) UNIQUE, Role VARCHAR(50), Password VARCHAR(255) NULL)")
        cursor.execute("CREATE TABLE IF NOT EXISTS Tickets (Ticket_ID INT AUTO_INCREMENT PRIMARY KEY, Customer_ID INT, Agent_ID INT NULL, Subject VARCHAR(255), Description TEXT, Status VARCHAR(50) DEFAULT 'Open', Priority VARCHAR(50), FollowUpCount INT DEFAULT 0, Rating INT NULL, Created_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, Assigned_At DATETIME NULL, Resolved_At DATETIME NULL, Due_Date DATETIME NULL)")
        cursor.execute("CREATE TABLE IF NOT EXISTS Ticket_Conversations (Message_ID INT AUTO_INCREMENT PRIMARY KEY, Ticket_ID INT, Sender_Role VARCHAR(50), Message_Text TEXT, Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
        cursor.execute("CREATE TABLE IF NOT EXISTS Password_Change_Requests (Request_ID INT AUTO_INCREMENT PRIMARY KEY, Agent_ID INT, Status VARCHAR(50) DEFAULT 'Pending', Requested_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    else:
        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS Customers (Customer_ID INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, Email_ID TEXT UNIQUE);
            CREATE TABLE IF NOT EXISTS Support_Agents (Agent_ID INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, Email_ID TEXT UNIQUE, Role TEXT, Password TEXT NULL);
            CREATE TABLE IF NOT EXISTS Tickets (Ticket_ID INTEGER PRIMARY KEY AUTOINCREMENT, Customer_ID INTEGER, Agent_ID INTEGER NULL, Subject TEXT, Description TEXT, Status TEXT DEFAULT 'Open', Priority TEXT, FollowUpCount INTEGER DEFAULT 0, Rating INTEGER NULL, Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP, Assigned_At DATETIME NULL, Resolved_At DATETIME NULL, Due_Date DATETIME NULL);
            CREATE TABLE IF NOT EXISTS Ticket_Conversations (Message_ID INTEGER PRIMARY KEY AUTOINCREMENT, Ticket_ID INTEGER, Sender_Role TEXT, Message_Text TEXT, Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE IF NOT EXISTS Password_Change_Requests (Request_ID INTEGER PRIMARY KEY AUTOINCREMENT, Agent_ID INTEGER, Status TEXT DEFAULT 'Pending', Requested_At DATETIME DEFAULT CURRENT_TIMESTAMP);
        """)
    
    # Initial Admin Seed
    def h(p): return hashlib.sha256(p.encode()).hexdigest()
    agents = [
        ('Admin', 'admin@support.com', 'Administrator', h('admin1234')),
        ('Ganesh', 'ganesh@support.com', 'Agent', h('ganesh123')),
        ('Rudransh', 'rudransh@support.com', 'Agent', h('rudransh123'))
    ]
    for n, e, r, p in agents:
        execute_query(cursor, f"SELECT Agent_ID FROM Support_Agents WHERE Email_ID = {PH}", (e,))
        if not cursor.fetchone():
            execute_query(cursor, f"INSERT INTO Support_Agents (Name, Email_ID, Role, Password) VALUES ({PH}, {PH}, {PH}, {PH})", (n, e, r, p))
    
    if not IS_MYSQL: conn.commit()
    conn.close()

def process_row(d):
    if not d: return {}
    for key in ['Created_Date', 'Assigned_At', 'Resolved_At', 'Due_Date', 'Requested_At', 'Timestamp']:
        if key in d and d[key] and isinstance(d[key], str):
            try: d[key] = datetime.strptime(d[key].split('.')[0], "%Y-%m-%d %H:%M:%S")
            except: pass
    return d

def format_datetime(value, format="%d %b, %I:%M %p"):
    if not value: return ""
    if isinstance(value, str):
        try:
            dt = datetime.strptime(value.split('.')[0], "%Y-%m-%d %H:%M:%S")
            return dt.strftime(format)
        except: return value
    return value.strftime(format)

class CustomTemplates(Jinja2Templates):
    def TemplateResponse(self, name: str, context: dict, **kwargs):
        request = context.get("request")
        if request:
            context["session"] = request.session
            context["request"].args = request.query_params
            context["get_flashed_messages"] = lambda **c_kwargs: self.get_flashed_messages_helper(request, **c_kwargs)
        return super().TemplateResponse(name, context, **kwargs)

    def get_flashed_messages_helper(self, request: Request, with_categories: bool = False):
        messages = request.session.pop("_messages", [])
        if with_categories: return [(m["category"], m["message"]) for m in messages]
        return [m["message"] for m in messages]

templates = CustomTemplates(directory="templates")
templates.env.filters['strftime'] = format_datetime
templates.env.filters['tojson'] = lambda v: json.dumps(v)

def flash(request: Request, message: str, category: str = "info"):
    if "_messages" not in request.session: request.session["_messages"] = []
    request.session["_messages"].append({"message": message, "category": category})

# ─── ROUTES ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup_event(): init_db()

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("raise_ticket.html", {"request": request, "history": [], "customer_name": ""})

@app.post("/raise_ticket")
async def raise_ticket_post(request: Request, email: str = Form(...), subject: str = Form(...), description: str = Form(...), priority: str = Form(...)):
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"SELECT Customer_ID FROM Customers WHERE Email_ID = {PH}", (email,))
    customer = fetch_one(cursor)
    if not customer:
        execute_query(cursor, f"INSERT INTO Customers (Name, Email_ID) VALUES ({PH}, {PH})", (email.split('@')[0], email))
        customer_id = cursor.lastrowid
    else: customer_id = customer['Customer_ID']
    execute_query(cursor, f"INSERT INTO Tickets (Customer_ID, Subject, Description, Priority, Status) VALUES ({PH}, {PH}, {PH}, {PH}, 'Open')", (customer_id, subject, description, priority))
    if not IS_MYSQL: conn.commit()
    conn.close()
    flash(request, "Ticket raised successfully!", "success")
    return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/search_history", response_class=HTMLResponse)
async def search_history(request: Request, search_email: str = Form(...), filter_status: Optional[str] = Form(None), filter_priority: Optional[str] = Form(None)):
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"SELECT Customer_ID, Name FROM Customers WHERE Email_ID = {PH}", (search_email,))
    customer = fetch_one(cursor)
    history = []
    if customer:
        query = "SELECT * FROM Tickets WHERE Customer_ID = %s"
        params = [customer['Customer_ID']]
        if filter_status: query += " AND Status = %s"; params.append(filter_status)
        if filter_priority: query += " AND Priority = %s"; params.append(filter_priority)
        query += " ORDER BY Ticket_ID DESC"
        execute_query(cursor, query, tuple(params))
        history = [process_row(r) for r in fetch_all(cursor)]
    
    agents = []
    user = request.session.get('user')
    if user:
        execute_query(cursor, "SELECT Agent_ID, Name FROM Support_Agents WHERE Role='Agent'")
        agents = fetch_all(cursor)
    conn.close()
    if user:
        return templates.TemplateResponse("dashboard.html", {"request": request, "tickets": history, "user": user, "agents": agents, "is_search": True, "last_email": search_email, "pw_requests": [], "now": datetime.now()})
    return templates.TemplateResponse("raise_ticket.html", {"request": request, "history": history, "customer_name": customer['Name'] if customer else "", "last_email": search_email})

@app.get("/ticket/{ticket_id}/conversation", response_class=HTMLResponse)
async def ticket_conversation(request: Request, ticket_id: int):
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"SELECT * FROM Tickets WHERE Ticket_ID = {PH}", (ticket_id,))
    ticket = fetch_one(cursor)
    if not ticket: raise HTTPException(status_code=404, detail="Not found")
    execute_query(cursor, f"SELECT * FROM Ticket_Conversations WHERE Ticket_ID = {PH} ORDER BY Timestamp ASC", (ticket_id,))
    messages = [process_row(r) for r in fetch_all(cursor)]
    conn.close()
    return templates.TemplateResponse("conversation.html", {"request": request, "ticket": process_row(ticket), "messages": messages})

@app.post("/ticket/{ticket_id}/conversation")
async def ticket_conversation_post(request: Request, ticket_id: int, message: str = Form(...)):
    user = request.session.get('user')
    role = user['Role'] if user else 'Customer'
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"INSERT INTO Ticket_Conversations (Ticket_ID, Sender_Role, Message_Text) VALUES ({PH}, {PH}, {PH})", (ticket_id, role, message))
    if not IS_MYSQL: conn.commit()
    conn.close()
    return RedirectResponse(url=f"/ticket/{ticket_id}/conversation", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/login_page", response_class=HTMLResponse)
async def login_page(request: Request): return templates.TemplateResponse("login.html", {"request": request})

@app.post("/auth")
async def auth(request: Request, email: str = Form(...), password: Optional[str] = Form("")):
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"SELECT * FROM Support_Agents WHERE Email_ID = {PH}", (email.strip(),))
    user = fetch_one(cursor)
    conn.close()
    if user:
        if not user.get('Password'):
            request.session['user'] = {k: v for k, v in user.items() if k != 'Password'}
            flash(request, "Please set a password.", "warning")
            return RedirectResponse(url="/set_password", status_code=status.HTTP_303_SEE_OTHER)
        if password and hashlib.sha256(password.encode()).hexdigest() == user['Password']:
            request.session['user'] = {k: v for k, v in user.items() if k != 'Password'}
            return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    flash(request, "Invalid credentials.", "danger")
    return RedirectResponse(url="/login_page", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, status_filter: Optional[str] = None):
    user = request.session.get('user')
    if not user: return RedirectResponse(url="/login_page", status_code=status.HTTP_303_SEE_OTHER)
    conn = get_db_conn(); cursor = conn.cursor()
    query = "SELECT t.*, (SELECT Message_Text FROM Ticket_Conversations WHERE Ticket_ID = t.Ticket_ID ORDER BY Timestamp DESC LIMIT 1) as last_message FROM Tickets t WHERE 1=1"
    params = []
    if user['Role'] != 'Administrator':
        query += " AND (Agent_ID = %s OR Agent_ID IS NULL)"; params.append(user['Agent_ID'])
    s = request.query_params.get("status") or status_filter
    if s: query += " AND Status = %s"; params.append(s)
    p = request.query_params.get("priority")
    if p: query += " AND Priority = %s"; params.append(p)
    d_filt = request.query_params.get("date")
    if d_filt: query += " AND date(Created_Date) = %s"; params.append(d_filt)
    query += " ORDER BY FollowUpCount DESC, Ticket_ID DESC"
    execute_query(cursor, query, tuple(params))
    tickets = [process_row(r) for r in fetch_all(cursor)]
    execute_query(cursor, "SELECT Agent_ID, Name FROM Support_Agents WHERE Role='Agent'")
    agents = fetch_all(cursor)
    pw_requests = []
    if user['Role'] == 'Administrator':
        execute_query(cursor, "SELECT r.*, a.Name, a.Email_ID FROM Password_Change_Requests r JOIN Support_Agents a ON r.Agent_ID = a.Agent_ID WHERE r.Status = 'Pending' ORDER BY r.Requested_At DESC")
        pw_requests = [process_row(r) for r in fetch_all(cursor)]
    conn.close()
    return templates.TemplateResponse("dashboard.html", {"request": request, "tickets": tickets, "user": user, "agents": agents, "is_search": False, "pw_requests": pw_requests, "now": datetime.now()})

@app.get("/admin_report", response_class=HTMLResponse)
async def admin_report(request: Request):
    user = request.session.get('user')
    if not user or user['Role'] != 'Administrator': return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, "SELECT COUNT(*) as total, SUM(CASE WHEN Status='Resolved' THEN 1 ELSE 0 END) as resolved, SUM(CASE WHEN Status='Open' THEN 1 ELSE 0 END) as pending, ROUND(AVG(CASE WHEN Rating IS NOT NULL THEN Rating END), 1) as avg_rating FROM Tickets")
    stats = process_row(fetch_one(cursor))
    execute_query(cursor, "SELECT a.Name, COUNT(t.Ticket_ID) as assigned, SUM(CASE WHEN t.Status = 'Resolved' THEN 1 ELSE 0 END) as solved, ROUND(AVG(CASE WHEN t.Rating IS NOT NULL THEN t.Rating END), 1) as avg_rating FROM Support_Agents a LEFT JOIN Tickets t ON a.Agent_ID = t.Agent_ID WHERE a.Role = 'Agent' GROUP BY a.Agent_ID, a.Name")
    performance = fetch_all(cursor)
    execute_query(cursor, "SELECT Priority, COUNT(*) as count FROM Tickets GROUP BY Priority")
    priority_data = fetch_all(cursor)
    execute_query(cursor, "SELECT date(Created_Date) as day, COUNT(*) as count FROM Tickets WHERE Created_Date >= date('now', '-7 days') GROUP BY date(Created_Date) ORDER BY day ASC")
    daily_data = fetch_all(cursor)
    conn.close()
    return templates.TemplateResponse("admin_report.html", {"request": request, "stats": stats, "performance": performance, "priority_data": priority_data, "daily_data": daily_data})

@app.post("/add_agent")
async def add_agent(request: Request, name: str = Form(...), email: str = Form(...), role: str = Form(...)):
    user = request.session.get('user')
    if not user or user['Role'] != 'Administrator': return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    conn = get_db_conn(); cursor = conn.cursor()
    try:
        execute_query(cursor, f"INSERT INTO Support_Agents (Name, Email_ID, Role) VALUES ({PH}, {PH}, {PH})", (name, email, role))
        if not IS_MYSQL: conn.commit()
        flash(request, f"Added {name}.", "success")
    except: flash(request, "Error adding member.", "danger")
    conn.close(); return RedirectResponse(url="/admin_report", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/handle_pw_request/{req_id}/{action}")
async def handle_pw_request(request: Request, req_id: int, action: str):
    if not request.session.get('user') or request.session['user']['Role'] != 'Administrator': return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    conn = get_db_conn(); cursor = conn.cursor()
    new_status = 'Approved' if action == 'approve' else 'Denied'
    execute_query(cursor, f"UPDATE Password_Change_Requests SET Status = {PH} WHERE Request_ID = {PH}", (new_status, req_id))
    if not IS_MYSQL: conn.commit()
    conn.close(); flash(request, f"Request {new_status}.", "info")
    return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/request_password_change")
async def request_password_change(request: Request):
    user = request.session.get('user')
    if not user: return RedirectResponse(url="/login_page", status_code=status.HTTP_303_SEE_OTHER)
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"INSERT INTO Password_Change_Requests (Agent_ID, Status) VALUES ({PH}, 'Pending')", (user['Agent_ID'],))
    if not IS_MYSQL: conn.commit()
    conn.close(); flash(request, "Request sent to admin.", "info")
    return RedirectResponse(url="/set_password", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/assign_ticket/{ticket_id}")
async def assign_ticket(request: Request, ticket_id: int, agent_id: Optional[int] = Form(None)):
    if not request.session.get('user') or request.session['user']['Role'] != 'Administrator': return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    conn = get_db_conn(); cursor = conn.cursor()
    if agent_id:
        execute_query(cursor, f"SELECT Priority FROM Tickets WHERE Ticket_ID = {PH}", (ticket_id,))
        t = fetch_one(cursor)
        hr = {'High': 24, 'Medium': 48, 'Low': 72}.get(t['Priority'] if t else 'Low', 48)
        due = datetime.now() + timedelta(hours=hr)
        execute_query(cursor, f"UPDATE Tickets SET Agent_ID = {PH}, Assigned_At = CURRENT_TIMESTAMP, Due_Date = {PH} WHERE Ticket_ID = {PH}", (agent_id, due, ticket_id))
    else: execute_query(cursor, f"UPDATE Tickets SET Agent_ID = NULL, Assigned_At = NULL, Due_Date = NULL WHERE Ticket_ID = {PH}", (ticket_id,))
    if not IS_MYSQL: conn.commit()
    conn.close(); return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/resolve_ticket/{ticket_id}")
async def resolve_ticket(request: Request, ticket_id: int):
    if not request.session.get('user'): return RedirectResponse(url="/login_page", status_code=status.HTTP_303_SEE_OTHER)
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"UPDATE Tickets SET Status = 'Resolved', Resolved_At = CURRENT_TIMESTAMP WHERE Ticket_ID = {PH}", (ticket_id,))
    if not IS_MYSQL: conn.commit()
    conn.close(); flash(request, "Resolved.", "success")
    return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/logout")
async def logout(request: Request): request.session.clear(); return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/set_password", response_class=HTMLResponse)
async def set_password_page(request: Request):
    user = request.session.get('user')
    if not user: return RedirectResponse(url="/login_page", status_code=status.HTTP_303_SEE_OTHER)
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"SELECT Password FROM Support_Agents WHERE Agent_ID = {PH}", (user['Agent_ID'],))
    row = fetch_one(cursor); conn.close()
    approved = True
    if user['Role'] == 'Agent' and row and row['Password']:
        conn = get_db_conn(); cursor = conn.cursor()
        execute_query(cursor, f"SELECT * FROM Password_Change_Requests WHERE Agent_ID = {PH} AND Status = 'Approved'", (user['Agent_ID'],))
        approved = bool(cursor.fetchone()); conn.close()
    return templates.TemplateResponse("set_password.html", {"request": request, "user": user, "change_approved": approved})

@app.post("/set_password")
async def set_password_post(request: Request, password: str = Form(...), confirm: str = Form(...)):
    if password != confirm: flash(request, "Mismatch.", "danger"); return RedirectResponse(url="/set_password", status_code=status.HTTP_303_SEE_OTHER)
    user = request.session.get('user')
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"UPDATE Support_Agents SET Password = {PH} WHERE Agent_ID = {PH}", (hashlib.sha256(password.encode()).hexdigest(), user['Agent_ID']))
    if user['Role'] == 'Agent': execute_query(cursor, f"UPDATE Password_Change_Requests SET Status = 'Done' WHERE Agent_ID = {PH} AND Status = 'Approved'", (user['Agent_ID'],))
    if not IS_MYSQL: conn.commit()
    conn.close(); flash(request, "Updated.", "success")
    return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/rate_ticket/{ticket_id}/{rating}")
async def rate_ticket(request: Request, ticket_id: int, rating: int):
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"UPDATE Tickets SET Rating = {PH} WHERE Ticket_ID = {PH} AND Status = 'Resolved'", (rating, ticket_id))
    if not IS_MYSQL: conn.commit()
    conn.close(); return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)

@app.get("/follow_up/{ticket_id}")
async def follow_up_get(request: Request, ticket_id: int):
    conn = get_db_conn(); cursor = conn.cursor()
    execute_query(cursor, f"UPDATE Tickets SET FollowUpCount = FollowUpCount + 1, Status = 'Open' WHERE Ticket_ID = {PH}", (ticket_id,))
    if not IS_MYSQL: conn.commit()
    conn.close(); flash(request, "Follow-up sent!", "info")
    return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/ai_suggest")
async def ai_suggest(request: Request): return JSONResponse({'suggestion': 'AI key needed.'})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
